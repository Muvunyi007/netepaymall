from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel


class CartItemAdd(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: Optional[UUID]
    quantity: int
    saved_for_later: bool
    product: Optional[dict] = None
    variant: Optional[dict] = None
    
    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    id: UUID
    items: List[CartItemResponse] = []
    coupon_code: Optional[str]
    subtotal: float = 0
    discount: float = 0
    delivery_fee: float = 0
    tax: float = 0
    total: float = 0
    
    class Config:
        from_attributes = True


class WishlistItemAdd(BaseModel):
    product_id: UUID


class WishlistItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    product: Optional[dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class WishlistResponse(BaseModel):
    id: UUID
    items: List[WishlistItemResponse] = []
    
    class Config:
        from_attributes = True