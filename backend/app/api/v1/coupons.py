from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.coupon import Coupon, CouponUsage
from app.schemas.order import CouponValidate, CouponResponse, ResponseModel
from app.api.deps import get_current_user, require_role
from app.core.exceptions import NotFoundException, BadRequestException
from uuid import UUID
from decimal import Decimal
from datetime import datetime, timezone

router = APIRouter(tags=["Coupons"])


@router.post("/coupons/validate", response_model=ResponseModel)
async def validate_coupon(
    coupon_data: CouponValidate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Coupon).where(
            Coupon.code == coupon_data.code.upper(),
            Coupon.is_active == True
        )
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise NotFoundException("Invalid coupon code")
    
    now = datetime.now(timezone.utc)
    if coupon.start_date and coupon.start_date > now:
        raise BadRequestException("Coupon is not yet active")
    
    if coupon.end_date and coupon.end_date < now:
        raise BadRequestException("Coupon has expired")
    
    if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
        raise BadRequestException("Coupon usage limit reached")
    
    if coupon.user_usage_limit:
        user_usage = await db.execute(
            select(CouponUsage).where(
                CouponUsage.coupon_id == coupon.id,
                CouponUsage.user_id == current_user.id
            )
        )
        if len(user_usage.scalars().all()) >= coupon.user_usage_limit:
            raise BadRequestException("You have reached the usage limit for this coupon")
    
    return ResponseModel(
        data={
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "minimum_order_amount": float(coupon.minimum_order_amount) if coupon.minimum_order_amount else None,
            "maximum_discount_amount": float(coupon.maximum_discount_amount) if coupon.maximum_discount_amount else None,
            "description": coupon.description
        },
        message="Coupon is valid"
    )


@router.get("/coupons/available", response_model=ResponseModel)
async def get_available_coupons(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Coupon).where(
            Coupon.is_active == True,
            (Coupon.start_date == None) | (Coupon.start_date <= now),
            (Coupon.end_date == None) | (Coupon.end_date >= now),
            (Coupon.usage_limit == None) | (Coupon.usage_count < Coupon.usage_limit)
        )
    )
    coupons = result.scalars().all()
    
    return ResponseModel(
        data=[CouponResponse.model_validate(coupon) for coupon in coupons]
    )


@router.get("/admin/coupons", response_model=ResponseModel)
async def admin_list_coupons(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(Coupon.id))
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = select(Coupon).order_by(Coupon.created_at.desc()).offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    coupons = result.scalars().all()

    total_pages = (total + limit - 1) // limit

    return ResponseModel(
        data=[{
            "id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": float(coupon.discount_value),
            "minimum_order_amount": float(coupon.minimum_order_amount) if coupon.minimum_order_amount else None,
            "maximum_discount_amount": float(coupon.maximum_discount_amount) if coupon.maximum_discount_amount else None,
            "usage_limit": coupon.usage_limit,
            "user_usage_limit": coupon.user_usage_limit,
            "usage_count": coupon.usage_count,
            "description": coupon.description,
            "start_date": coupon.start_date,
            "end_date": coupon.end_date,
            "is_active": coupon.is_active,
            "created_at": coupon.created_at
        } for coupon in coupons],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        }
    )


@router.post("/admin/coupons", response_model=ResponseModel)
async def create_coupon(
    coupon_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    existing = await db.execute(
        select(Coupon).where(Coupon.code == coupon_data["code"].upper())
    )
    if existing.scalar_one_or_none():
        raise BadRequestException("Coupon with this code already exists")
    
    coupon_data["code"] = coupon_data["code"].upper()
    coupon = Coupon(**coupon_data)
    db.add(coupon)
    await db.flush()
    
    return ResponseModel(
        data=CouponResponse.model_validate(coupon),
        message="Coupon created successfully"
    )


@router.patch("/admin/coupons/{coupon_id}", response_model=ResponseModel)
async def update_coupon(
    coupon_id: UUID,
    update_data: dict,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Coupon).where(Coupon.id == coupon_id)
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise NotFoundException("Coupon not found")
    
    for key, value in update_data.items():
        if key == "code":
            value = value.upper()
            existing = await db.execute(
                select(Coupon).where(Coupon.code == value, Coupon.id != coupon_id)
            )
            if existing.scalar_one_or_none():
                raise BadRequestException("Coupon with this code already exists")
        setattr(coupon, key, value)
    
    await db.flush()
    
    return ResponseModel(
        data=CouponResponse.model_validate(coupon),
        message="Coupon updated successfully"
    )


@router.delete("/admin/coupons/{coupon_id}")
async def delete_coupon(
    coupon_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Coupon).where(Coupon.id == coupon_id)
    )
    coupon = result.scalar_one_or_none()
    
    if not coupon:
        raise NotFoundException("Coupon not found")
    
    coupon.is_active = False
    return {"message": "Coupon deleted successfully"}