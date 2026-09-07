from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, Payment, PaymentStatus, Delivery, DeliveryStatus
from app.models.product import Product, Inventory
from app.models.support import SupportRequest
from app.models.system import SystemSetting, AuditLog
from app.schemas.order import ResponseModel
from app.api.deps import require_role
from uuid import UUID
from datetime import datetime, timezone, timedelta
import re as _re

router = APIRouter(prefix="/admin", tags=["Admin"])


def slugify(value: str) -> str:
    value = _re.sub(r"[^\w\s-]", "", (value or "").lower())
    value = _re.sub(r"[\s_-]+", "-", value).strip("-")
    return value or "product"


@router.get("/dashboard", response_model=ResponseModel)
async def get_dashboard_stats(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    today = datetime.now(timezone.utc).date()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    
    total_revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(Payment.status == PaymentStatus.SUCCESSFUL)
    )
    total_revenue = total_revenue_result.scalar() or 0
    
    today_revenue_result = await db.execute(
        select(func.sum(Payment.amount)).where(
            Payment.status == PaymentStatus.SUCCESSFUL,
            Payment.created_at >= today_start
        )
    )
    today_revenue = today_revenue_result.scalar() or 0
    
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar()
    
    pending_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.PENDING)
    )
    pending_orders = pending_orders_result.scalar()
    
    completed_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.status == OrderStatus.DELIVERED)
    )
    completed_orders = completed_orders_result.scalar()
    
    from app.models.user import User as UserModel
    total_customers_result = await db.execute(
        select(func.count(UserModel.id)).where(UserModel.role == UserRole.USER)
    )
    total_customers = total_customers_result.scalar()
    
    total_products_result = await db.execute(select(func.count(Product.id)))
    total_products = total_products_result.scalar()
    
    low_stock_result = await db.execute(
        select(func.count(Inventory.id)).where(
            Inventory.quantity <= Inventory.low_stock_threshold,
            Inventory.track_inventory == True
        )
    )
    low_stock = low_stock_result.scalar()
    
    successful_payments_result = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == PaymentStatus.SUCCESSFUL)
    )
    successful_payments = successful_payments_result.scalar()
    
    failed_payments_result = await db.execute(
        select(func.count(Payment.id)).where(Payment.status == PaymentStatus.FAILED)
    )
    failed_payments = failed_payments_result.scalar()
    
    open_support_result = await db.execute(
        select(func.count(SupportRequest.id)).where(SupportRequest.status == "open")
    )
    open_support = open_support_result.scalar()

    last_7_start = today - timedelta(days=6)
    last_7_start_dt = datetime.combine(last_7_start, datetime.min.time()).replace(tzinfo=timezone.utc)
    revenue_rows = await db.execute(
        select(func.date(Payment.created_at), func.sum(Payment.amount))
        .where(
            Payment.status == PaymentStatus.SUCCESSFUL,
            Payment.created_at >= last_7_start_dt,
        )
        .group_by(func.date(Payment.created_at))
    )
    revenue_by_day_map = {str(day): float(amount) for day, amount in revenue_rows.all()}
    revenue_by_day = []
    for i in range(7):
        day = last_7_start + timedelta(days=i)
        revenue_by_day.append({
            "date": day.isoformat(),
            "day": day.strftime("%a"),
            "revenue": revenue_by_day_map.get(day.isoformat(), 0.0),
        })

    return ResponseModel(
        data={
            "total_revenue": float(total_revenue),
            "today_revenue": float(today_revenue),
            "total_orders": total_orders,
            "pending_orders": pending_orders,
            "completed_orders": completed_orders,
            "total_customers": total_customers,
            "total_products": total_products,
            "low_stock": low_stock,
            "successful_payments": successful_payments,
            "failed_payments": failed_payments,
            "open_support_requests": open_support,
            "revenue_by_day": revenue_by_day,
        }
    )


@router.get("/orders", response_model=ResponseModel)
async def admin_list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    query = select(Order).options(selectinload(Order.items), selectinload(Order.user))
    count_query = select(func.count(Order.id))
    
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
    
    data = []
    for order in orders:
        user = order.user
        data.append({
            "id": order.id,
            "order_number": order.order_number,
            "status": order.status.value if hasattr(order.status, "value") else order.status,
            "subtotal": float(order.subtotal),
            "delivery_fee": float(order.delivery_fee),
            "tax": float(order.tax),
            "discount": float(order.discount),
            "total": float(order.total),
            "coupon_code": order.coupon_code,
            "notes": order.notes,
            "delivery_method": order.delivery_method,
            "created_at": order.created_at,
            "confirmed_at": order.confirmed_at,
            "shipped_at": order.shipped_at,
            "delivered_at": order.delivered_at,
            "user": {
                "first_name": user.first_name if user else None,
                "last_name": user.last_name if user else None,
                "email": user.email if user else None,
                "phone": user.phone if user else None,
            },
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "variant_id": item.variant_id,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "total_price": float(item.total_price),
                    "product_name": item.product_name,
                    "product_image": item.product_image,
                }
                for item in order.items
            ],
        })
    
    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    )


@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: UUID,
    status_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    
    if not order:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Order not found")
    
    new_status = status_data.get("status")
    valid_transitions = {
        OrderStatus.PENDING: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
        OrderStatus.CONFIRMED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
        OrderStatus.PROCESSING: [OrderStatus.PACKED, OrderStatus.CANCELLED],
        OrderStatus.PACKED: [OrderStatus.SHIPPED],
        OrderStatus.SHIPPED: [OrderStatus.OUT_FOR_DELIVERY],
        OrderStatus.OUT_FOR_DELIVERY: [OrderStatus.DELIVERED],
    }
    
    allowed = valid_transitions.get(order.status, [])
    try:
        target_status = OrderStatus(new_status)
    except ValueError:
        from app.core.exceptions import BadRequestException
        raise BadRequestException("Invalid status")
    
    if target_status not in allowed:
        from app.core.exceptions import BadRequestException
        raise BadRequestException(f"Cannot transition from {order.status.value} to {new_status}")
    
    order.status = target_status
    
    if target_status == OrderStatus.CONFIRMED:
        order.confirmed_at = datetime.now(timezone.utc)
    elif target_status == OrderStatus.SHIPPED:
        order.shipped_at = datetime.now(timezone.utc)
    elif target_status == OrderStatus.DELIVERED:
        order.delivered_at = datetime.now(timezone.utc)
    elif target_status == OrderStatus.CANCELLED:
        order.cancelled_at = datetime.now(timezone.utc)
    
    audit_log = AuditLog(
        admin_id=current_user.id,
        action=f"Updated order status to {new_status}",
        entity="Order",
        entity_id=str(order_id),
        result="success"
    )
    db.add(audit_log)
    
    await db.flush()
    
    return {"message": f"Order status updated to {new_status}"}


@router.get("/products", response_model=ResponseModel)
async def admin_list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(Product.id)).where(Product.deleted_at == None)
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = select(Product).options(
        selectinload(Product.images),
        selectinload(Product.variants),
        selectinload(Product.inventory),
        selectinload(Product.category),
    ).where(Product.deleted_at == None).order_by(Product.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    from app.schemas.product import ProductResponse
    return ResponseModel(
        data=[ProductResponse.model_validate(product) for product in products],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    )


@router.post("/products", response_model=ResponseModel)
async def admin_create_product(
    product_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    from decimal import Decimal, InvalidOperation
    from app.models.product import Product as ProductModel, ProductImage, Inventory

    data = dict(product_data)
    image_urls = None
    if "image_urls" in data:
        image_urls = data.pop("image_urls")
    elif "images" in data:
        image_urls = data.pop("images")
    inventory_data = data.pop("inventory", None) if isinstance(data.get("inventory"), dict) else None
    data.pop("variants", None)

    for field in ("price", "compare_price", "cost_price", "weight"):
        value = data.get(field)
        if value in (None, ""):
            data.pop(field, None)
        else:
            try:
                data[field] = Decimal(str(value))
            except InvalidOperation:
                data.pop(field, None)

    name = data.get("name") or ""
    if not data.get("slug"):
        data["slug"] = slugify(name)

    from uuid import uuid4
    base_slug = data["slug"] or slugify(name)
    slug = base_slug
    for _ in range(5):
        exists = (await db.execute(select(Product.id).where(Product.slug == slug))).first()
        if exists:
            slug = f"{base_slug}-{uuid4().hex[:8]}"
        else:
            break
    data["slug"] = slug

    if data.get("sku"):
        from uuid import uuid4 as _u
        base_sku = str(data["sku"])
        sku = base_sku
        for _ in range(5):
            exists = (await db.execute(select(Product.id).where(Product.sku == sku))).first()
            if exists:
                sku = f"{base_sku}-{_u().hex[:6]}"
            else:
                break
        data["sku"] = sku

    if data.get("category_id"):
        from app.core.exceptions import BadRequestException
        try:
            data["category_id"] = UUID(str(data["category_id"]))
        except (ValueError, AttributeError, TypeError):
            raise BadRequestException("Invalid category selected")

    product = ProductModel(**data)
    db.add(product)
    await db.flush()

    if isinstance(image_urls, list):
        for idx, img in enumerate(image_urls):
            if isinstance(img, dict):
                url = img.get("url")
                alt_text = img.get("alt_text")
                is_primary = bool(img.get("is_primary") or idx == 0)
            else:
                url = img
                alt_text = None
                is_primary = idx == 0
            if not url:
                continue
            db.add(ProductImage(
                product_id=product.id,
                url=str(url),
                alt_text=alt_text,
                sort_order=idx,
                is_primary=is_primary,
            ))

    if inventory_data:
        quantity = int(inventory_data.get("quantity") or 0)
        db.add(Inventory(
            product_id=product.id,
            quantity=quantity,
            low_stock_threshold=int(inventory_data.get("low_stock_threshold") or 10),
            track_inventory=bool(inventory_data.get("track_inventory", True)),
            allow_backorder=bool(inventory_data.get("allow_backorder", False)),
        ))

    await db.flush()

    result = await db.execute(
        select(ProductModel).options(
            selectinload(ProductModel.images),
            selectinload(ProductModel.variants),
            selectinload(ProductModel.inventory),
            selectinload(ProductModel.category),
        ).where(ProductModel.id == product.id)
    )
    product = result.scalar_one()

    from app.schemas.product import ProductResponse
    return ResponseModel(
        data=ProductResponse.model_validate(product),
        message="Product created successfully"
    )


@router.patch("/products/{product_id}", response_model=ResponseModel)
async def admin_update_product(
    product_id: UUID,
    update_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    from decimal import Decimal, InvalidOperation
    from sqlalchemy import delete
    from app.models.product import Product as ProductModel, ProductImage, Inventory
    from app.core.exceptions import NotFoundException

    result = await db.execute(
        select(Product).options(
            selectinload(Product.images),
            selectinload(Product.variants),
            selectinload(Product.inventory),
            selectinload(Product.category),
        ).where(Product.id == product_id, Product.deleted_at == None)
    )
    product = result.scalar_one_or_none()

    if not product:
        raise NotFoundException("Product not found")

    data = dict(update_data)
    image_urls = None
    if "image_urls" in data:
        image_urls = data.pop("image_urls")
    elif "images" in data:
        image_urls = data.pop("images")
    inventory_data = data.pop("inventory", None) if isinstance(data.get("inventory"), dict) else None
    data.pop("variants", None)

    for field in ("price", "compare_price", "cost_price", "weight"):
        value = data.get(field)
        if value in (None, ""):
            data.pop(field, None)
        else:
            try:
                data[field] = Decimal(str(value))
            except InvalidOperation:
                data.pop(field, None)

    for key, value in data.items():
        if key == "category_id" and value:
            try:
                data[key] = UUID(str(value))
            except (ValueError, AttributeError, TypeError):
                from app.core.exceptions import BadRequestException
                raise BadRequestException("Invalid category selected")
        setattr(product, key, data[key])

    if image_urls is not None:
        await db.execute(delete(ProductImage).where(ProductImage.product_id == product.id))
        for idx, img in enumerate(image_urls):
            if isinstance(img, dict):
                url = img.get("url")
                alt_text = img.get("alt_text")
                is_primary = bool(img.get("is_primary") or idx == 0)
            else:
                url = img
                alt_text = None
                is_primary = idx == 0
            if not url:
                continue
            db.add(ProductImage(
                product_id=product.id,
                url=str(url),
                alt_text=alt_text,
                sort_order=idx,
                is_primary=is_primary,
            ))

    if inventory_data is not None:
        inv = product.inventory
        if inv is None:
            inv = Inventory(product_id=product.id)
            db.add(inv)
        inv.quantity = int(inventory_data.get("quantity", inv.quantity or 0))
        inv.low_stock_threshold = int(inventory_data.get("low_stock_threshold", inv.low_stock_threshold or 10))
        inv.track_inventory = bool(inventory_data.get("track_inventory", inv.track_inventory))
        inv.allow_backorder = bool(inventory_data.get("allow_backorder", inv.allow_backorder))

    await db.flush()

    product.images = (await db.execute(
        select(ProductImage).where(ProductImage.product_id == product.id).order_by(ProductImage.sort_order)
    )).scalars().all()
    product.inventory = (await db.execute(
        select(Inventory).where(Inventory.product_id == product.id)
    )).scalar_one_or_none()

    from app.schemas.product import ProductResponse
    return ResponseModel(
        data=ProductResponse.model_validate(product),
        message="Product updated successfully"
    )


@router.delete("/products/{product_id}")
async def admin_delete_product(
    product_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.deleted_at == None)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Product not found")
    
    from datetime import datetime, timezone
    product.deleted_at = datetime.now(timezone.utc)
    product.is_active = False
    
    return {"message": "Product deleted successfully"}


@router.get("/settings", response_model=ResponseModel)
async def get_system_settings(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(SystemSetting))
    settings = result.scalars().all()
    
    settings_dict = {setting.key: setting.value for setting in settings}
    
    return ResponseModel(data=settings_dict)


@router.patch("/settings")
async def update_system_settings(
    settings_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    for key, value in settings_data.items():
        result = await db.execute(
            select(SystemSetting).where(SystemSetting.key == key)
        )
        setting = result.scalar_one_or_none()
        
        if setting:
            setting.value = value
        else:
            setting = SystemSetting(key=key, value=value)
            db.add(setting)
    
    audit_log = AuditLog(
        admin_id=current_user.id,
        action="Updated system settings",
        entity="SystemSetting",
        details=str(settings_data.keys()),
        result="success"
    )
    db.add(audit_log)
    
    await db.flush()
    
    return {"message": "Settings updated successfully"}


@router.get("/audit-logs", response_model=ResponseModel)
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(AuditLog.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = select(AuditLog).order_by(AuditLog.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    return ResponseModel(
        data=[{
            "id": log.id,
            "admin_id": log.admin_id,
            "action": log.action,
            "entity": log.entity,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "result": log.result,
            "created_at": log.created_at
        } for log in logs],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    )


@router.get("/users", response_model=ResponseModel)
async def admin_list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = None,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF)),
    db: AsyncSession = Depends(get_db)
):
    query = select(User).where(User.role == UserRole.USER)
    count_query = select(func.count(User.id)).where(User.role == UserRole.USER)

    if search:
        like = f"%{search}%"
        query = query.where(
            (User.email.ilike(like)) |
            (User.first_name.ilike(like)) |
            (User.last_name.ilike(like)) |
            (User.phone.ilike(like))
        )
        count_query = count_query.where(
            (User.email.ilike(like)) |
            (User.first_name.ilike(like)) |
            (User.last_name.ilike(like)) |
            (User.phone.ilike(like))
        )

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    users = result.scalars().all()

    total_pages = (total + limit - 1) // limit

    data = []
    for user in users:
        user_orders = await db.execute(select(func.count(Order.id)).where(Order.user_id == user.id))
        total_orders = user_orders.scalar() or 0
        user_revenue = await db.execute(
            select(func.coalesce(func.sum(Order.total), 0)).where(Order.user_id == user.id)
        )
        total_spent = float(user_revenue.scalar() or 0)
        data.append({
            "id": user.id,
            "email": user.email,
            "phone": user.phone,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "created_at": user.created_at,
            "total_orders": total_orders,
            "total_spent": total_spent,
        })

    return ResponseModel(
        data=data,
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    )