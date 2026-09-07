from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, OrderItem, Payment, PaymentStatus, Delivery, DeliveryStatus
from app.models.product import Product, Category, Inventory
from app.models.review import Review
from app.models.support import SupportRequest, SupportMessage
from app.models.notification import Notification, NotificationType
from app.models.system import AuditLog
from app.schemas.order import ResponseModel, SupportMessageCreate
from app.api.deps import require_role
from app.core.exceptions import NotFoundException, BadRequestException, ConflictException
from app.core.security import get_password_hash
from uuid import UUID
from datetime import datetime, timezone, timedelta
from decimal import Decimal

router = APIRouter(prefix="/admin", tags=["Admin"])

MONTH_LABELS = {1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec"}

EXCLUDED_ORDER_STATUSES = [OrderStatus.CANCELLED, OrderStatus.RETURNED, OrderStatus.REFUNDED]


@router.get("/analytics", response_model=ResponseModel)
async def admin_analytics(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    month_keys = []
    for i in range(11, -1, -1):
        year = now.year
        month = now.month - i
        while month <= 0:
            month += 12
            year -= 1
        month_keys.append((year, month))

    month_index = {f"{year}-{month}": idx for idx, (year, month) in enumerate(month_keys)}

    revenue_by_month = [{"month": MONTH_LABELS[m], "revenue": 0} for _, m in month_keys]
    payments_result = await db.execute(
        select(Payment.created_at, Payment.amount).where(Payment.status == PaymentStatus.SUCCESSFUL)
    )
    total_revenue = 0.0
    for created_at, amount in payments_result.all():
        revenue = float(amount or 0)
        total_revenue += revenue
        key = f"{created_at.year}-{created_at.month}"
        if key in month_index:
            revenue_by_month[month_index[key]]["revenue"] += revenue

    customer_growth = [{"month": MONTH_LABELS[m], "customers": 0} for _, m in month_keys]
    users_result = await db.execute(
        select(User.created_at).where(User.role == UserRole.USER, User.deleted_at == None)
    )
    for created_at, in users_result.all():
        key = f"{created_at.year}-{created_at.month}"
        if key in month_index:
            customer_growth[month_index[key]]["customers"] += 1

    running = 0
    for entry in customer_growth:
        running += entry["customers"]
        entry["customers"] = running

    top_products_data = {}
    items_result = await db.execute(
        select(OrderItem.product_id, OrderItem.product_name, OrderItem.product_image, func.sum(OrderItem.quantity), func.sum(OrderItem.total_price))
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.notin_(EXCLUDED_ORDER_STATUSES))
        .group_by(OrderItem.product_id, OrderItem.product_name, OrderItem.product_image)
    )
    for product_id, name, image, qty, rev in items_result.all():
        top_products_data[str(product_id)] = {
            "name": name,
            "image": image,
            "sales": int(qty or 0),
            "revenue": float(rev or 0),
        }
    top_products = sorted(top_products_data.values(), key=lambda p: p["sales"], reverse=True)[:5]

    category_sales_data = {}
    category_result = await db.execute(
        select(Category.name, func.sum(OrderItem.quantity))
        .join(Product, Product.id == OrderItem.product_id)
        .join(Category, Category.id == Product.category_id)
        .join(Order, Order.id == OrderItem.order_id)
        .where(Order.status.notin_(EXCLUDED_ORDER_STATUSES))
        .group_by(Category.name)
    )
    total_units = 0
    for name, qty in category_result.all():
        category_sales_data[name] = int(qty or 0)
        total_units += int(qty or 0)
    category_sales = [
        {"name": name, "value": round((qty / total_units) * 100, 1) if total_units else 0}
        for name, qty in category_sales_data.items()
    ]

    successful_count = await db.execute(select(func.count(Payment.id)).where(Payment.status == PaymentStatus.SUCCESSFUL))
    failed_count = await db.execute(select(func.count(Payment.id)).where(Payment.status == PaymentStatus.FAILED))
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_customers_result = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.USER, User.deleted_at == None)
    )
    total_orders = total_orders_result.scalar() or 0
    total_customers = total_customers_result.scalar() or 0

    return ResponseModel(
        data={
            "kpis": {
                "total_revenue": round(total_revenue, 2),
                "total_orders": total_orders,
                "total_customers": total_customers,
                "conversion_rate": round((total_orders / total_customers * 100) if total_customers else 0, 1),
            },
            "revenue_by_month": revenue_by_month,
            "top_products": top_products,
            "category_sales": category_sales,
            "customer_growth": customer_growth,
            "payment_breakdown": {
                "successful": successful_count.scalar() or 0,
                "failed": failed_count.scalar() or 0,
            },
        }
    )


@router.get("/inventory", response_model=ResponseModel)
async def admin_list_inventory(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = None,
    low_stock_only: bool = False,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(Product.id)).where(Product.deleted_at == None)
    query = select(Product).options(
        selectinload(Product.inventory),
        selectinload(Product.images),
    ).where(Product.deleted_at == None)

    if search:
        like = f"%{search}%"
        count_query = count_query.where(
            or_(Product.name.ilike(like), Product.sku.ilike(like), Product.brand.ilike(like))
        )
        query = query.where(or_(Product.name.ilike(like), Product.sku.ilike(like), Product.brand.ilike(like)))

    if low_stock_only:
        count_query = count_query.join(Inventory).where(Inventory.quantity <= Inventory.low_stock_threshold)
        query = query.join(Inventory).where(Inventory.quantity <= Inventory.low_stock_threshold)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(
        query.order_by(Product.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    products = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for product in products:
        inventory = product.inventory
        quantity = inventory.quantity if inventory else 0
        threshold = inventory.low_stock_threshold if inventory else 10
        reserved = inventory.reserved if inventory else 0
        track = inventory.track_inventory if inventory else True
        backorder = inventory.allow_backorder if inventory else False
        status = "out_of_stock"
        if quantity > 0:
            status = "low_stock" if quantity <= threshold else "in_stock"
        data.append({
            "product_id": product.id,
            "name": product.name,
            "slug": product.slug,
            "sku": product.sku,
            "price": float(product.price),
            "image": product.images[0].url if product.images else None,
            "quantity": quantity,
            "reserved": reserved,
            "available": quantity - reserved,
            "low_stock_threshold": threshold,
            "track_inventory": track,
            "allow_backorder": backorder,
            "status": status,
            "is_active": product.is_active,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


@router.patch("/inventory/{product_id}", response_model=ResponseModel)
async def admin_update_inventory(
    product_id: UUID,
    update_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at == None).options(selectinload(Product.inventory))
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")

    if not product.inventory:
        product.inventory = Inventory(product_id=product.id)
        db.add(product.inventory)

    inventory = product.inventory
    for key in ["quantity", "reserved", "low_stock_threshold"]:
        if key in update_data:
            setattr(inventory, key, int(update_data[key]))
    for key in ["track_inventory", "allow_backorder"]:
        if key in update_data:
            setattr(inventory, key, bool(update_data[key]))

    audit_log = AuditLog(
        admin_id=current_user.id,
        action="Updated inventory",
        entity="Inventory",
        entity_id=str(product_id),
        result="success",
    )
    db.add(audit_log)
    await db.flush()

    return ResponseModel(
        data={
            "product_id": product.id,
            "quantity": inventory.quantity,
            "reserved": inventory.reserved,
            "available": inventory.quantity - inventory.reserved,
            "low_stock_threshold": inventory.low_stock_threshold,
            "track_inventory": inventory.track_inventory,
            "allow_backorder": inventory.allow_backorder,
        },
        message="Inventory updated successfully",
    )


@router.get("/payments", response_model=ResponseModel)
async def admin_list_payments(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Payment).options(
        selectinload(Payment.order).selectinload(Order.user)
    )
    count_query = select(func.count(Payment.id))

    if status:
        query = query.where(Payment.status == status)
        count_query = count_query.where(Payment.status == status)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(query.order_by(Payment.created_at.desc()).offset((page - 1) * limit).limit(limit))
    payments = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for payment in payments:
        order = payment.order
        user = order.user if order else None
        data.append({
            "id": payment.id,
            "order_id": payment.order_id,
            "order_number": order.order_number if order else None,
            "provider": payment.provider,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status.value if hasattr(payment.status, "value") else payment.status,
            "reference": payment.reference,
            "customer": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
            },
            "created_at": payment.created_at,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


@router.get("/payments/{payment_id}", response_model=ResponseModel)
async def admin_get_payment(
    payment_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id).options(
            selectinload(Payment.order).selectinload(Order.user),
            selectinload(Payment.transactions),
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise NotFoundException("Payment not found")

    order = payment.order
    user = order.user if order else None
    return ResponseModel(
        data={
            "id": payment.id,
            "order_id": payment.order_id,
            "order_number": order.order_number if order else None,
            "provider": payment.provider,
            "amount": float(payment.amount),
            "currency": payment.currency,
            "status": payment.status.value if hasattr(payment.status, "value") else payment.status,
            "reference": payment.reference,
            "customer": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
            },
            "transactions": [
                {
                    "id": t.id,
                    "type": t.type,
                    "amount": float(t.amount),
                    "status": t.status,
                    "reference": t.reference,
                    "created_at": t.created_at,
                }
                for t in payment.transactions
            ],
            "created_at": payment.created_at,
        }
    )


@router.get("/deliveries", response_model=ResponseModel)
async def admin_list_deliveries(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Delivery).options(
        selectinload(Delivery.order).selectinload(Order.user)
    )
    count_query = select(func.count(Delivery.id))

    if status:
        query = query.where(Delivery.status == status)
        count_query = count_query.where(Delivery.status == status)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(query.order_by(Delivery.updated_at.desc()).offset((page - 1) * limit).limit(limit))
    deliveries = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for delivery in deliveries:
        order = delivery.order
        user = order.user if order else None
        data.append({
            "id": delivery.id,
            "order_id": delivery.order_id,
            "order_number": order.order_number if order else None,
            "order_total": float(order.total) if order else 0,
            "customer": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
            },
            "address": order.delivery_address_id if order else None,
            "status": delivery.status.value if hasattr(delivery.status, "value") else delivery.status,
            "courier_name": delivery.courier_name,
            "courier_phone": delivery.courier_phone,
            "tracking_number": delivery.tracking_number,
            "estimated_delivery": delivery.estimated_delivery,
            "actual_delivery": delivery.actual_delivery,
            "delivery_zone": delivery.delivery_zone,
            "notes": delivery.notes,
            "created_at": delivery.created_at,
            "updated_at": delivery.updated_at,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


DELIVERY_STATUSES = [s.value for s in DeliveryStatus]


@router.patch("/deliveries/{order_id}", response_model=ResponseModel)
async def admin_update_delivery(
    order_id: UUID,
    update_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one_or_none()
    if not order:
        raise NotFoundException("Order not found")

    delivery_result = await db.execute(select(Delivery).where(Delivery.order_id == order_id))
    delivery = delivery_result.scalar_one_or_none()
    if not delivery:
        delivery = Delivery(order_id=order_id)
        db.add(delivery)

    if "status" in update_data:
        if update_data["status"] not in DELIVERY_STATUSES:
            raise BadRequestException("Invalid delivery status")
        delivery.status = update_data["status"]
        if update_data["status"] == DeliveryStatus.DELIVERED.value:
            delivery.actual_delivery = datetime.now(timezone.utc)
            if order.status == OrderStatus.OUT_FOR_DELIVERY:
                order.status = OrderStatus.DELIVERED
                order.delivered_at = datetime.now(timezone.utc)

    for key in ["courier_name", "courier_phone", "tracking_number", "delivery_zone", "notes"]:
        if key in update_data:
            setattr(delivery, key, update_data[key])
    if "estimated_delivery" in update_data and update_data["estimated_delivery"]:
        delivery.estimated_delivery = datetime.fromisoformat(str(update_data["estimated_delivery"]).replace("Z", "+00:00"))

    audit_log = AuditLog(
        admin_id=current_user.id,
        action="Updated delivery",
        entity="Delivery",
        entity_id=str(order_id),
        result="success",
    )
    db.add(audit_log)
    await db.flush()

    return ResponseModel(
        data={
            "id": delivery.id,
            "order_id": order_id,
            "status": delivery.status.value if hasattr(delivery.status, "value") else delivery.status,
            "courier_name": delivery.courier_name,
            "courier_phone": delivery.courier_phone,
            "tracking_number": delivery.tracking_number,
            "estimated_delivery": delivery.estimated_delivery,
            "delivery_zone": delivery.delivery_zone,
            "notes": delivery.notes,
        },
        message="Delivery updated successfully",
    )


@router.get("/reviews", response_model=ResponseModel)
async def admin_list_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    rating: int = None,
    verified: bool = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Review).options(
        selectinload(Review.user),
        selectinload(Review.product),
    ).where(Review.deleted_at == None)
    count_query = select(func.count(Review.id)).where(Review.deleted_at == None)

    if rating is not None:
        query = query.where(Review.rating == rating)
        count_query = count_query.where(Review.rating == rating)
    if verified is not None:
        query = query.where(Review.is_verified == verified)
        count_query = count_query.where(Review.is_verified == verified)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(query.order_by(Review.created_at.desc()).offset((page - 1) * limit).limit(limit))
    reviews = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for review in reviews:
        user = review.user
        product = review.product
        data.append({
            "id": review.id,
            "user_id": review.user_id,
            "customer": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
            },
            "product_id": review.product_id,
            "product_name": product.name if product else None,
            "product_image": product.images[0].url if product and product.images else None,
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "is_verified": review.is_verified,
            "helpful_count": review.helpful_count,
            "created_at": review.created_at,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


@router.patch("/reviews/{review_id}", response_model=ResponseModel)
async def admin_update_review(
    review_id: UUID,
    update_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Review).where(Review.id == review_id, Review.deleted_at == None)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundException("Review not found")

    for key in ["rating", "title", "comment", "is_verified", "helpful_count"]:
        if key in update_data:
            setattr(review, key, update_data[key])

    await db.flush()
    return ResponseModel(
        data={"id": review.id, "is_verified": review.is_verified, "rating": review.rating},
        message="Review updated successfully",
    )


@router.delete("/reviews/{review_id}")
async def admin_delete_review(
    review_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Review).where(Review.id == review_id, Review.deleted_at == None))
    review = result.scalar_one_or_none()
    if not review:
        raise NotFoundException("Review not found")

    review.deleted_at = datetime.now(timezone.utc)
    audit_log = AuditLog(
        admin_id=current_user.id,
        action="Deleted review",
        entity="Review",
        entity_id=str(review_id),
        result="success",
    )
    db.add(audit_log)
    return {"message": "Review deleted successfully"}


@router.get("/support-requests", response_model=ResponseModel)
async def admin_list_support_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = None,
    priority: str = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    query = select(SupportRequest).options(selectinload(SupportRequest.user))
    count_query = select(func.count(SupportRequest.id))

    if status:
        query = query.where(SupportRequest.status == status)
        count_query = count_query.where(SupportRequest.status == status)
    if priority:
        query = query.where(SupportRequest.priority == priority)
        count_query = count_query.where(SupportRequest.priority == priority)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(
        query.order_by(SupportRequest.created_at.desc()).offset((page - 1) * limit).limit(limit)
    )
    requests = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for req in requests:
        user = req.user
        messages_count = await db.execute(
            select(func.count(SupportMessage.id)).where(SupportMessage.request_id == req.id)
        )
        data.append({
            "id": req.id,
            "user_id": req.user_id,
            "customer": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
            },
            "order_id": req.order_id,
            "subject": req.subject,
            "message": req.message,
            "category": req.category,
            "priority": req.priority,
            "status": req.status,
            "messages_count": messages_count.scalar() or 0,
            "created_at": req.created_at,
            "updated_at": req.updated_at,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


@router.get("/support-requests/{request_id}", response_model=ResponseModel)
async def admin_get_support_request(
    request_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportRequest).where(SupportRequest.id == request_id).options(selectinload(SupportRequest.user))
    )
    support_request = result.scalar_one_or_none()
    if not support_request:
        raise NotFoundException("Support request not found")

    messages_result = await db.execute(
        select(SupportMessage).where(SupportMessage.request_id == request_id)
        .options(selectinload(SupportMessage.sender))
        .order_by(SupportMessage.created_at)
    )
    messages = messages_result.scalars().all()
    user = support_request.user

    return ResponseModel(
        data={
            "request": {
                "id": support_request.id,
                "user_id": support_request.user_id,
                "customer": {
                    "first_name": user.first_name if user else None,
                    "last_name": user.last_name if user else None,
                    "email": user.email if user else None,
                },
                "order_id": support_request.order_id,
                "subject": support_request.subject,
                "message": support_request.message,
                "category": support_request.category,
                "priority": support_request.priority,
                "status": support_request.status,
                "created_at": support_request.created_at,
                "updated_at": support_request.updated_at,
            },
            "messages": [
                {
                    "id": msg.id,
                    "request_id": msg.request_id,
                    "sender_id": msg.sender_id,
                    "sender_name": f"{msg.sender.first_name} {msg.sender.last_name}" if msg.sender else None,
                    "message": msg.message,
                    "is_internal": msg.is_internal,
                    "is_admin": msg.sender.role != UserRole.USER if msg.sender else False,
                    "created_at": msg.created_at,
                }
                for msg in messages
            ],
        }
    )


SUPPORT_STATUSES = ["open", "in_progress", "on_hold", "resolved", "closed"]


@router.patch("/support-requests/{request_id}", response_model=ResponseModel)
async def admin_update_support_request(
    request_id: UUID,
    update_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SupportRequest).where(SupportRequest.id == request_id))
    support_request = result.scalar_one_or_none()
    if not support_request:
        raise NotFoundException("Support request not found")

    if "status" in update_data:
        if update_data["status"] not in SUPPORT_STATUSES:
            raise BadRequestException("Invalid support status")
        support_request.status = update_data["status"]
    if "priority" in update_data:
        support_request.priority = update_data["priority"]
    if "assigned_to" in update_data and update_data["assigned_to"]:
        support_request.assigned_to = UUID(str(update_data["assigned_to"]))
    if "category" in update_data:
        support_request.category = update_data["category"]

    await db.flush()
    return ResponseModel(
        data={"id": support_request.id, "status": support_request.status, "priority": support_request.priority},
        message="Support request updated successfully",
    )


@router.post("/support-requests/{request_id}/messages", response_model=ResponseModel)
async def admin_reply_support_request(
    request_id: UUID,
    message_data: SupportMessageCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SupportRequest).where(SupportRequest.id == request_id))
    support_request = result.scalar_one_or_none()
    if not support_request:
        raise NotFoundException("Support request not found")

    message = SupportMessage(
        request_id=request_id,
        sender_id=current_user.id,
        message=message_data.message,
        is_internal=message_data.is_internal,
    )
    db.add(message)
    if not message_data.is_internal:
        support_request.status = "resolved" if support_request.status == "open" else support_request.status

    await db.flush()
    return ResponseModel(
        data={"id": message.id, "request_id": request_id, "message": message.message, "is_internal": message.is_internal},
        message="Message sent successfully",
    )


@router.get("/notifications", response_model=ResponseModel)
async def admin_list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    total = (await db.execute(select(func.count(Notification.id)))).scalar() or 0
    result = await db.execute(
        select(Notification).options(selectinload(Notification.user))
        .order_by(Notification.created_at.desc())
        .offset((page - 1) * limit).limit(limit)
    )
    notifications = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for notification in notifications:
        user = notification.user
        data.append({
            "id": notification.id,
            "user_id": notification.user_id,
            "customer": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
            },
            "type": notification.type.value if hasattr(notification.type, "value") else notification.type,
            "title": notification.title,
            "message": notification.message,
            "is_read": notification.is_read,
            "created_at": notification.created_at,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


NOTIFICATION_TYPES = [t.value for t in NotificationType]


@router.post("/notifications/broadcast", response_model=ResponseModel)
async def admin_broadcast_notification(
    notification_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    ntype = notification_data.get("type", NotificationType.SYSTEM.value)
    if ntype not in NOTIFICATION_TYPES:
        raise BadRequestException("Invalid notification type")
    title = notification_data.get("title")
    message = notification_data.get("message")
    if not title or not message:
        raise BadRequestException("title and message are required")

    target_ids = []
    if notification_data.get("user_id"):
        target_ids = [UUID(str(notification_data["user_id"]))]
    else:
        users_result = await db.execute(
            select(User.id).where(User.role == UserRole.USER, User.is_active == True, User.deleted_at == None)
        )
        target_ids = users_result.scalars().all()

    for user_id in target_ids:
        db.add(Notification(user_id=user_id, type=ntype, title=title, message=message))

    audit_log = AuditLog(
        admin_id=current_user.id,
        action="Sent broadcast notification",
        entity="Notification",
        details=title,
        result="success",
    )
    db.add(audit_log)
    await db.flush()

    return ResponseModel(
        data={"recipients": len(target_ids)},
        message=f"Notification sent to {len(target_ids)} users",
    )


ADMIN_ROLES = [UserRole.STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN]


@router.get("/administrators", response_model=ResponseModel)
async def admin_list_administrators(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.role.in_(ADMIN_ROLES), User.deleted_at == None)
    count_query = select(func.count(User.id)).where(User.role.in_(ADMIN_ROLES), User.deleted_at == None)

    total = (await db.execute(count_query)).scalar() or 0
    result = await db.execute(query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit))
    users = result.scalars().all()
    total_pages = (total + limit - 1) // limit

    data = []
    for user in users:
        orders_count = await db.execute(select(func.count(Order.id)).where(Order.user_id == user.id))
        data.append({
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "orders_handled": orders_count.scalar() or 0,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
        }
    )


@router.post("/administrators", response_model=ResponseModel)
async def admin_create_administrator(
    user_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    email = user_data.get("email", "").lower().strip()
    if not email:
        raise BadRequestException("email is required")
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ConflictException("A user with this email already exists")

    role = user_data.get("role", "STAFF")
    try:
        role_enum = UserRole(role)
    except ValueError:
        raise BadRequestException("Invalid role")

    if not user_data.get("password"):
        raise BadRequestException("password is required")

    user = User(
        email=email,
        phone=user_data.get("phone"),
        first_name=user_data.get("first_name", ""),
        last_name=user_data.get("last_name", ""),
        role=role_enum,
        password_hash=get_password_hash(user_data["password"]),
        is_active=bool(user_data.get("is_active", True)),
        is_verified=bool(user_data.get("is_verified", True)),
    )
    db.add(user)
    await db.flush()

    audit_log = AuditLog(
        admin_id=current_user.id,
        action="Created administrator",
        entity="User",
        entity_id=str(user.id),
        details=email,
        result="success",
    )
    db.add(audit_log)

    return ResponseModel(
        data={
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "is_active": user.is_active,
        },
        message="Administrator created successfully",
    )


@router.patch("/administrators/{user_id}", response_model=ResponseModel)
async def admin_update_administrator(
    user_id: UUID,
    update_data: dict = Body(...),
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at == None))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")
    if user.role not in ADMIN_ROLES:
        raise BadRequestException("Target user is not an administrator")

    if "role" in update_data:
        try:
            user.role = UserRole(update_data["role"])
        except ValueError:
            raise BadRequestException("Invalid role")
    if "first_name" in update_data:
        user.first_name = update_data["first_name"]
    if "last_name" in update_data:
        user.last_name = update_data["last_name"]
    if "phone" in update_data:
        user.phone = update_data["phone"]
    if "is_active" in update_data:
        user.is_active = bool(update_data["is_active"])
    if "password" in update_data and update_data["password"]:
        user.password_hash = get_password_hash(update_data["password"])

    if user.is_active is False:
        user.deleted_at = datetime.now(timezone.utc)

    await db.flush()
    return ResponseModel(
        data={
            "id": user.id,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active,
        },
        message="Administrator updated successfully",
    )


@router.delete("/administrators/{user_id}")
async def admin_delete_administrator(
    user_id: UUID,
    current_user: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    if user_id == current_user.id:
        raise BadRequestException("You cannot deactivate your own account")

    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at == None))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User not found")

    user.is_active = False
    user.deleted_at = datetime.now(timezone.utc)
    return {"message": "Administrator deactivated successfully"}