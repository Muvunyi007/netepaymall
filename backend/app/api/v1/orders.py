from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.order import Order, OrderItem, OrderStatus
from app.models.cart import Cart, CartItem
from app.models.product import Product, Inventory
from app.models.coupon import Coupon, CouponUsage
from app.schemas.order import OrderCreate, OrderResponse, ResponseModel, PaginationMeta
from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException, BadRequestException
from uuid import UUID
from decimal import Decimal
import random
import string
from datetime import datetime, timezone

router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number():
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"ORD-{timestamp}-{random_chars}"


@router.post("", response_model=ResponseModel)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    cart_result = await db.execute(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.inventory),
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.variant),
        )
        .where(Cart.user_id == current_user.id)
    )
    cart = cart_result.scalar_one_or_none()
    
    if not cart or not cart.items:
        raise BadRequestException("Cart is empty")
    
    subtotal = Decimal("0")
    order_items = []
    
    for cart_item in cart.items:
        product = cart_item.product
        price = product.price
        if cart_item.variant and cart_item.variant.price:
            price = cart_item.variant.price
        
        inventory = None
        if product.inventory and product.inventory.track_inventory:
            if product.inventory.quantity - product.inventory.reserved < cart_item.quantity:
                raise BadRequestException(f"Insufficient stock for {product.name}")
            product.inventory.reserved += cart_item.quantity
            inventory = product.inventory
        
        item_total = price * cart_item.quantity
        subtotal += item_total
        
        order_items.append(OrderItem(
            product_id=cart_item.product_id,
            variant_id=cart_item.variant_id,
            quantity=cart_item.quantity,
            unit_price=price,
            total_price=item_total,
            product_name=product.name,
            product_image=product.images[0].url if product.images else None
        ))
    
    discount = Decimal("0")
    if cart.coupon_code:
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.code == cart.coupon_code, Coupon.is_active == True)
        )
        coupon = coupon_result.scalar_one_or_none()
        if coupon:
            if coupon.discount_type == "percentage":
                discount = min(subtotal * coupon.discount_value / 100, coupon.maximum_discount_amount or subtotal)
            else:
                discount = min(coupon.discount_value, subtotal)
            
            coupon.usage_count += 1
    
    delivery_fee = order_data.delivery_fee or Decimal("0")
    tax = Decimal("0")
    total = subtotal - discount + delivery_fee + tax
    
    order = Order(
        order_number=generate_order_number(),
        user_id=current_user.id,
        status=OrderStatus.PENDING,
        subtotal=subtotal,
        delivery_fee=delivery_fee,
        tax=tax,
        discount=discount,
        total=total,
        coupon_code=cart.coupon_code,
        delivery_address_id=order_data.delivery_address_id,
        delivery_instructions=order_data.delivery_instructions,
        notes=order_data.notes,
        delivery_method=order_data.delivery_method
    )
    db.add(order)
    await db.flush()
    
    if cart.coupon_code and discount > 0:
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.code == cart.coupon_code, Coupon.is_active == True)
        )
        coupon = coupon_result.scalar_one_or_none()
        if coupon:
            coupon_usage = CouponUsage(
                coupon_id=coupon.id,
                user_id=current_user.id,
                order_id=order.id,
                discount_amount=discount
            )
            db.add(coupon_usage)
    
    for item in order_items:
        item.order_id = order.id
        db.add(item)
    
    for cart_item in cart.items:
        await db.delete(cart_item)
    cart.coupon_code = None
    
    await db.flush()

    from app.services.notifications import create_notification
    from app.models.notification import NotificationType
    await create_notification(
        db,
        user_id=current_user.id,
        type=NotificationType.ORDER,
        title="Order Placed",
        message=f"Your order {order.order_number} has been placed successfully.",
        data={"order_id": str(order.id), "order_number": order.order_number, "total": float(order.total)}
    )
    await db.flush()

    return ResponseModel(
        data={
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status.value,
            "total": float(order.total)
        },
        message="Order created successfully"
    )


@router.get("", response_model=ResponseModel)
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(selectinload(Order.items)).where(Order.user_id == current_user.id)
    count_query = select(func.count(Order.id)).where(Order.user_id == current_user.id)
    
    if status:
        query = query.where(Order.status == status)
        count_query = count_query.where(Order.status == status)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.order_by(Order.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    orders = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    return ResponseModel(
        data=[OrderResponse.model_validate(order) for order in orders],
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        ).model_dump()
    )


@router.get("/{order_id}", response_model=ResponseModel)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    return ResponseModel(data=OrderResponse.model_validate(order))


@router.post("/{order_id}/cancel")
async def cancel_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order).options(selectinload(Order.items)).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    if order.status not in [OrderStatus.PENDING, OrderStatus.CONFIRMED]:
        raise BadRequestException("Order cannot be cancelled")
    
    order.status = OrderStatus.CANCELLED
    order.cancelled_at = datetime.now(timezone.utc)
    
    for item in order.items:
        inventory_result = await db.execute(
            select(Inventory).where(Inventory.product_id == item.product_id)
        )
        inventory = inventory_result.scalar_one_or_none()
        if inventory:
            inventory.reserved = max(0, inventory.reserved - item.quantity)
    
    return {"message": "Order cancelled successfully"}


@router.get("/{order_id}/tracking", response_model=ResponseModel)
async def track_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.user_id == current_user.id
        )
    )
    order = result.scalar_one_or_none()
    
    if not order:
        raise NotFoundException("Order not found")
    
    timeline = []
    status_order = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PROCESSING,
        OrderStatus.PACKED,
        OrderStatus.SHIPPED,
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED
    ]
    
    current_index = status_order.index(order.status) if order.status in status_order else -1
    
    for i, status in enumerate(status_order):
        timeline.append({
            "status": status.value,
            "completed": i <= current_index,
            "timestamp": order.created_at.isoformat() if i == 0 else None
        })
    
    return ResponseModel(
        data={
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.status.value,
            "timeline": timeline,
            "updated_at": order.updated_at.isoformat()
        }
    )