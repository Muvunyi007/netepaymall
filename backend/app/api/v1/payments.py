from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.order import Payment, PaymentStatus, PaymentTransaction, PaymentWebhook, Order, OrderStatus
from app.models.product import Inventory
from app.schemas.order import PaymentCreate, PaymentResponse, ResponseModel
from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException, BadRequestException, PaymentException
from app.core.config import settings
from app.services.payment import get_payment_provider
from uuid import UUID
import hashlib
import hmac
import json
from datetime import datetime, timezone
import uuid

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/create", response_model=ResponseModel)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    order_result = await db.execute(
        select(Order).where(
            Order.id == payment_data.order_id,
            Order.user_id == current_user.id
        )
    )
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    existing_payment = await db.execute(
        select(Payment).where(
            Payment.order_id == order.id,
            Payment.status.in_([PaymentStatus.PENDING, PaymentStatus.PROCESSING])
        )
    )
    if existing_payment.scalar_one_or_none():
        raise BadRequestException("Payment already in progress for this order")
    
    idempotency_key = payment_data.idempotency_key or str(uuid.uuid4())
    
    reference = f"PAY-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8]}"
    
    payment = Payment(
        order_id=order.id,
        provider=payment_data.provider,
        amount=order.total,
        currency="NGN",
        status=PaymentStatus.PENDING,
        reference=reference,
        idempotency_key=idempotency_key,
        metadata=json.dumps({"order_number": order.order_number})
    )
    db.add(payment)
    await db.flush()
    
    transaction = PaymentTransaction(
        payment_id=payment.id,
        type="initialization",
        amount=order.total,
        status="pending",
        reference=reference
    )
    db.add(transaction)
    await db.flush()

    provider = get_payment_provider()
    init_result = await provider.initialize_payment(
        reference=reference,
        amount=float(order.total),
        currency=payment.currency,
        metadata=json.loads(payment.payload) if payment.payload else None,
    )

    payment_url = init_result.get("checkout_url")
    if init_result.get("success") and not payment_url:
        payment_url = f"{settings.PAYMENT_CHECKOUT_BASE_URL}/{reference}"

    return ResponseModel(
        data={
            "id": payment.id,
            "reference": reference,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "provider": payment.provider,
            "payment_url": payment_url,
            "provider_payload": init_result.get("payload", {}),
        },
        message="Payment created successfully"
    )


@router.post("/{payment_id}/verify", response_model=ResponseModel)
async def verify_payment(
    payment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise NotFoundException("Payment not found")
    
    order_result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.id == payment.order_id,
            Order.user_id == current_user.id
        )
    )
    order = order_result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    if payment.status == PaymentStatus.SUCCESSFUL:
        return ResponseModel(
            data=PaymentResponse.model_validate(payment),
            message="Payment already verified"
        )
    
    payment.status = PaymentStatus.PROCESSING
    await db.flush()

    provider = get_payment_provider()
    verification_result = await provider.verify_payment(payment.reference, None)
    
    if verification_result["success"]:
        payment.status = PaymentStatus.SUCCESSFUL
        order.status = OrderStatus.CONFIRMED
        
        transaction = PaymentTransaction(
            payment_id=payment.id,
            type="verification",
            amount=payment.amount,
            status="successful",
            reference=payment.reference
        )
        db.add(transaction)
        
        for order_item in order.items:
            inventory_result = await db.execute(
                select(Inventory).where(Inventory.product_id == order_item.product_id)
            )
            inventory = inventory_result.scalar_one_or_none()
            if inventory:
                inventory.reserved = max(0, inventory.reserved - order_item.quantity)
                inventory.quantity = max(0, inventory.quantity - order_item.quantity)
        
        await db.flush()

        from app.services.notifications import create_notification
        from app.models.notification import NotificationType
        await create_notification(
            db,
            user_id=current_user.id,
            type=NotificationType.PAYMENT,
            title="Payment Successful",
            message=f"Your payment for order {order.order_number} was successful.",
            data={"payment_id": str(payment.id), "order_id": str(order.id), "reference": payment.reference}
        )
        await db.flush()

        return ResponseModel(
            data=PaymentResponse.model_validate(payment),
            message="Payment verified successfully"
        )
    else:
        payment.status = PaymentStatus.FAILED
        
        transaction = PaymentTransaction(
            payment_id=payment.id,
            type="verification",
            amount=payment.amount,
            status="failed",
            reference=payment.reference,
            metadata=json.dumps(verification_result)
        )
        db.add(transaction)
        await db.flush()
        
        raise PaymentException("Payment verification failed")


@router.get("/{payment_id}", response_model=ResponseModel)
async def get_payment(
    payment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise NotFoundException("Payment not found")
    
    order_result = await db.execute(
        select(Order).where(
            Order.id == payment.order_id,
            Order.user_id == current_user.id
        )
    )
    if not order_result.scalar_one_or_none():
        raise NotFoundException("Order not found")
    
    return ResponseModel(data=PaymentResponse.model_validate(payment))


@router.post("/webhook")
async def payment_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    body = await request.body()
    headers = dict(request.headers)
    
    signature = headers.get("x-webhook-signature", "")
    
    if settings.PAYMENT_WEBHOOK_SECRET:
        expected_signature = hmac.new(
            settings.PAYMENT_WEBHOOK_SECRET.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_signature):
            raise BadRequestException("Invalid webhook signature")
    
    try:
        payload = json.loads(body)
    except json.JSONDecodeError:
        raise BadRequestException("Invalid JSON payload")
    
    webhook = PaymentWebhook(
        provider=payload.get("provider", "unknown"),
        event_type=payload.get("event_type", "unknown"),
        payload=json.dumps(payload),
        processed=False
    )
    db.add(webhook)
    await db.flush()
    
    event_type = payload.get("event_type")
    reference = payload.get("reference")
    
    if event_type and reference:
        result = await db.execute(
            select(Payment).where(Payment.reference == reference)
        )
        payment = result.scalar_one_or_none()
        
        if payment:
            if event_type == "payment.success":
                payment.status = PaymentStatus.SUCCESSFUL
                
                order_result = await db.execute(
                    select(Order).where(Order.id == payment.order_id)
                )
                order = order_result.scalar_one()
                if order:
                    order.status = OrderStatus.CONFIRMED
            
            elif event_type == "payment.failed":
                payment.status = PaymentStatus.FAILED
            
            webhook.processed = True
            
            transaction = PaymentTransaction(
                payment_id=payment.id,
                type="webhook",
                amount=payment.amount,
                status=event_type.split(".")[-1],
                reference=reference,
                metadata=json.dumps(payload)
            )
            db.add(transaction)
            
            await db.flush()
    
    return {"status": "ok"}