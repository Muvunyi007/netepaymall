from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal


class CategoryCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[UUID] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    parent_id: Optional[UUID] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None


class CategoryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    image_url: Optional[str]
    parent_id: Optional[UUID]
    is_active: bool
    sort_order: int
    
    class Config:
        from_attributes = True


class ProductImageCreate(BaseModel):
    url: str
    alt_text: Optional[str] = None
    sort_order: int = 0
    is_primary: bool = False


class ProductImageResponse(BaseModel):
    id: UUID
    url: str
    alt_text: Optional[str]
    sort_order: int
    is_primary: bool
    
    class Config:
        from_attributes = True


class ProductVariantCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    price: Optional[Decimal] = None
    compare_price: Optional[Decimal] = None
    options: Optional[str] = None
    is_active: bool = True


class ProductVariantResponse(BaseModel):
    id: UUID
    name: str
    sku: Optional[str]
    price: Optional[Decimal]
    compare_price: Optional[Decimal]
    options: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class InventoryResponse(BaseModel):
    quantity: int
    reserved: int
    low_stock_threshold: int
    track_inventory: bool
    allow_backorder: bool

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Decimal
    compare_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: UUID
    brand: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    is_digital: bool = False
    weight: Optional[Decimal] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[Decimal] = None
    compare_price: Optional[Decimal] = None
    cost_price: Optional[Decimal] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_id: Optional[UUID] = None
    brand: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_digital: Optional[bool] = None
    weight: Optional[Decimal] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[str] = None


class ProductResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    description: Optional[str]
    short_description: Optional[str]
    price: Decimal
    compare_price: Optional[Decimal]
    sku: Optional[str]
    brand: Optional[str]
    is_active: bool
    is_featured: bool
    category_id: UUID
    category: Optional[CategoryResponse] = None
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    inventory: Optional[InventoryResponse] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class InventoryUpdate(BaseModel):
    quantity: int
    low_stock_threshold: Optional[int] = 10
    track_inventory: bool = True
    allow_backorder: bool = False