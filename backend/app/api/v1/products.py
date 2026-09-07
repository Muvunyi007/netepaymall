from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.product import Product, Category, ProductImage, Inventory
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    CategoryCreate, CategoryUpdate, CategoryResponse,
    ProductImageResponse, ProductVariantResponse
)
from app.schemas.order import ResponseModel, PaginationMeta
from app.api.deps import get_current_user, require_role
from app.models.user import User, UserRole
from app.core.exceptions import NotFoundException, BadRequestException
from uuid import UUID
from typing import List, Optional
from decimal import Decimal

router = APIRouter(prefix="/products", tags=["Products"])

product_load_options = (
    selectinload(Product.images),
    selectinload(Product.variants),
    selectinload(Product.inventory),
)


@router.get("", response_model=ResponseModel)
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    sort_by: Optional[str] = "created_at",
    sort_order: Optional[str] = "desc",
    db: AsyncSession = Depends(get_db)
):
    query = select(Product).options(*product_load_options).where(Product.is_active == True, Product.deleted_at == None)
    count_query = select(func.count(Product.id)).where(Product.is_active == True, Product.deleted_at == None)
    
    if category_id:
        query = query.where(Product.category_id == category_id)
        count_query = count_query.where(Product.category_id == category_id)
    
    if search:
        search_filter = or_(
            Product.name.ilike(f"%{search}%"),
            Product.description.ilike(f"%{search}%"),
            Product.tags.ilike(f"%{search}%")
        )
        query = query.where(search_filter)
        count_query = count_query.where(search_filter)
    
    if min_price is not None:
        query = query.where(Product.price >= Decimal(str(min_price)))
        count_query = count_query.where(Product.price >= Decimal(str(min_price)))
    
    if max_price is not None:
        query = query.where(Product.price <= Decimal(str(max_price)))
        count_query = count_query.where(Product.price <= Decimal(str(max_price)))
    
    sort_column = getattr(Product, sort_by, Product.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    product_responses = []
    for product in products:
        prod_dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "short_description": product.short_description,
            "price": product.price,
            "compare_price": product.compare_price,
            "sku": product.sku,
            "brand": product.brand,
            "is_active": product.is_active,
            "is_featured": product.is_featured,
            "category_id": product.category_id,
            "images": [ProductImageResponse.model_validate(img) for img in product.images],
            "variants": [ProductVariantResponse.model_validate(var) for var in product.variants],
            "created_at": product.created_at
        }
        product_responses.append(prod_dict)
    
    total_pages = (total + limit - 1) // limit
    
    return ResponseModel(
        data=product_responses,
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        ).model_dump()
    )


@router.get("/featured", response_model=ResponseModel)
async def get_featured_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .options(*product_load_options)
        .where(Product.is_active == True, Product.is_featured == True, Product.deleted_at == None)
        .order_by(Product.created_at.desc())
        .limit(limit)
    )
    products = result.scalars().all()
    
    product_responses = []
    for product in products:
        prod_dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,
            "images": [ProductImageResponse.model_validate(img) for img in product.images],
            "created_at": product.created_at
        }
        product_responses.append(prod_dict)
    
    return ResponseModel(data=product_responses)


@router.get("/new", response_model=ResponseModel)
async def get_new_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .options(*product_load_options)
        .where(Product.is_active == True, Product.deleted_at == None)
        .order_by(Product.created_at.desc())
        .limit(limit)
    )
    products = result.scalars().all()
    
    product_responses = []
    for product in products:
        prod_dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,
            "images": [ProductImageResponse.model_validate(img) for img in product.images],
            "created_at": product.created_at
        }
        product_responses.append(prod_dict)
    
    return ResponseModel(data=product_responses)


@router.get("/popular", response_model=ResponseModel)
async def get_popular_products(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .options(*product_load_options)
        .where(Product.is_active == True, Product.deleted_at == None)
        .order_by(Product.created_at.desc())
        .limit(limit)
    )
    products = result.scalars().all()
    
    product_responses = []
    for product in products:
        prod_dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,
            "images": [ProductImageResponse.model_validate(img) for img in product.images],
            "created_at": product.created_at
        }
        product_responses.append(prod_dict)
    
    return ResponseModel(data=product_responses)


@router.get("/search", response_model=ResponseModel)
async def search_products(
    q: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    search_filter = or_(
        Product.name.ilike(f"%{q}%"),
        Product.description.ilike(f"%{q}%"),
        Product.tags.ilike(f"%{q}%"),
        Product.brand.ilike(f"%{q}%")
    )
    
    count_query = select(func.count(Product.id)).where(
        Product.is_active == True,
        Product.deleted_at == None,
        search_filter
    )
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = select(Product).options(*product_load_options).where(
        Product.is_active == True,
        Product.deleted_at == None,
        search_filter
    ).order_by(Product.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    products = result.scalars().all()
    
    product_responses = []
    for product in products:
        prod_dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "description": product.description,
            "price": product.price,
            "compare_price": product.compare_price,
            "images": [ProductImageResponse.model_validate(img) for img in product.images],
            "created_at": product.created_at
        }
        product_responses.append(prod_dict)
    
    total_pages = (total + limit - 1) // limit
    
    return ResponseModel(
        data=product_responses,
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        ).model_dump()
    )


def serialize_product(product):
    return {
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "description": product.description,
        "short_description": product.short_description,
        "price": product.price,
        "compare_price": product.compare_price,
        "sku": product.sku,
        "brand": product.brand,
        "is_active": product.is_active,
        "is_featured": product.is_featured,
        "category_id": product.category_id,
        "images": [ProductImageResponse.model_validate(img) for img in product.images],
        "variants": [ProductVariantResponse.model_validate(var) for var in product.variants],
        "created_at": product.created_at
    }


@router.get("/by-slug/{slug}", response_model=ResponseModel)
async def get_product_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .options(*product_load_options)
        .where(
            Product.slug == slug,
            Product.is_active == True,
            Product.deleted_at == None
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Product not found")
    
    return ResponseModel(data=serialize_product(product))


@router.get("/{product_id}", response_model=ResponseModel)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Product)
        .options(*product_load_options)
        .where(
            Product.id == product_id,
            Product.is_active == True,
            Product.deleted_at == None
        )
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Product not found")
    
    return ResponseModel(data=serialize_product(product))