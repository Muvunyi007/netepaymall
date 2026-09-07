from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.product import Category
from app.schemas.product import CategoryCreate, CategoryUpdate, CategoryResponse
from app.schemas.order import ResponseModel
from app.api.deps import require_role
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, ConflictException
from uuid import UUID
from typing import List

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", response_model=ResponseModel)
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Category)
        .where(Category.is_active == True)
        .order_by(Category.sort_order, Category.name)
    )
    categories = result.scalars().all()
    
    return ResponseModel(
        data=[CategoryResponse.model_validate(cat) for cat in categories]
    )


@router.get("/{slug}", response_model=ResponseModel)
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category).where(Category.slug == slug, Category.is_active == True)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundException("Category not found")
    
    return ResponseModel(data=CategoryResponse.model_validate(category))


@router.post("", response_model=ResponseModel)
async def create_category(
    category_data: CategoryCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category).where(Category.slug == category_data.slug)
    )
    if result.scalar_one_or_none():
        raise ConflictException("Category with this slug already exists")
    
    category = Category(**category_data.model_dump())
    db.add(category)
    await db.flush()
    
    return ResponseModel(data=CategoryResponse.model_validate(category))


@router.patch("/{category_id}", response_model=ResponseModel)
async def update_category(
    category_id: UUID,
    update_data: CategoryUpdate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundException("Category not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if "slug" in update_dict:
        existing = await db.execute(
            select(Category).where(
                Category.slug == update_dict["slug"],
                Category.id != category_id
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictException("Category with this slug already exists")
    
    for key, value in update_dict.items():
        setattr(category, key, value)
    
    await db.flush()
    
    return ResponseModel(data=CategoryResponse.model_validate(category))


@router.delete("/{category_id}")
async def delete_category(
    category_id: UUID,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Category).where(Category.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise NotFoundException("Category not found")
    
    category.is_active = False
    await db.flush()
    return {"message": "Category deleted successfully"}