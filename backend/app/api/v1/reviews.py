from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.product import Product
from app.models.review import Review
from app.schemas.order import ReviewCreate, ReviewUpdate, ReviewResponse, ResponseModel, PaginationMeta
from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from uuid import UUID

router = APIRouter(tags=["Reviews"])


@router.get("/products/{product_id}/reviews", response_model=ResponseModel)
async def get_product_reviews(
    product_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_active == True)
    )
    if not product_result.scalar_one_or_none():
        raise NotFoundException("Product not found")
    
    count_query = select(func.count(Review.id)).where(
        Review.product_id == product_id,
        Review.deleted_at == None
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = select(Review).options(selectinload(Review.user)).where(
        Review.product_id == product_id,
        Review.deleted_at == None
    ).order_by(Review.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    reviews = result.scalars().all()
    
    avg_rating_query = select(func.avg(Review.rating)).where(
        Review.product_id == product_id,
        Review.deleted_at == None
    )
    avg_result = await db.execute(avg_rating_query)
    avg_rating = avg_result.scalar() or 0
    
    total_pages = (total + limit - 1) // limit
    
    review_responses = []
    for review in reviews:
        review_dict = {
            "id": review.id,
            "user_id": review.user_id,
            "product_id": review.product_id,
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "is_verified": review.is_verified,
            "helpful_count": review.helpful_count,
            "created_at": review.created_at,
            "user": {
                "id": review.user.id,
                "first_name": review.user.first_name,
                "last_name": review.user.last_name
            } if review.user else None
        }
        review_responses.append(review_dict)
    
    return ResponseModel(
        data={
            "reviews": review_responses,
            "average_rating": float(avg_rating),
            "total_reviews": total
        },
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        ).model_dump()
    )


@router.post("/products/{product_id}/reviews", response_model=ResponseModel)
async def create_review(
    product_id: UUID,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    product_result = await db.execute(
        select(Product).where(Product.id == product_id, Product.is_active == True)
    )
    if not product_result.scalar_one_or_none():
        raise NotFoundException("Product not found")
    
    existing_review = await db.execute(
        select(Review).where(
            Review.user_id == current_user.id,
            Review.product_id == product_id,
            Review.deleted_at == None
        )
    )
    if existing_review.scalar_one_or_none():
        raise BadRequestException("You have already reviewed this product")
    
    from app.models.order import Order, OrderItem, OrderStatus
    order_check = await db.execute(
        select(Order).join(OrderItem).where(
            Order.user_id == current_user.id,
            OrderItem.product_id == product_id,
            Order.status == OrderStatus.DELIVERED
        )
    )
    has_purchased = order_check.scalar_one_or_none() is not None
    
    review = Review(
        user_id=current_user.id,
        product_id=product_id,
        rating=review_data.rating,
        title=review_data.title,
        comment=review_data.comment,
        is_verified=has_purchased
    )
    db.add(review)
    await db.flush()
    
    return ResponseModel(
        data=ReviewResponse.model_validate(review),
        message="Review created successfully"
    )


@router.patch("/reviews/{review_id}", response_model=ResponseModel)
async def update_review(
    review_id: UUID,
    update_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == current_user.id,
            Review.deleted_at == None
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(review, key, value)
    
    await db.flush()
    
    return ResponseModel(
        data=ReviewResponse.model_validate(review),
        message="Review updated successfully"
    )


@router.delete("/reviews/{review_id}")
async def delete_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Review).where(
            Review.id == review_id,
            Review.user_id == current_user.id,
            Review.deleted_at == None
        )
    )
    review = result.scalar_one_or_none()
    
    if not review:
        raise NotFoundException("Review not found")
    
    from datetime import datetime, timezone
    review.deleted_at = datetime.now(timezone.utc)
    
    return {"message": "Review deleted successfully"}