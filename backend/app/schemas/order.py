from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel
from decimal import Decimal
from app.schemas.user import ResponseModel, PaginationMeta


class OrderItemCreate(BaseModel):
    product_id: UUID
    variant_id: Optional[UUID] = None
    quantity: int


class OrderItemResponse(BaseModel):
    id: UUID
    product_id: UUID
    variant_id: Optional[UUID]
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    product_name: str
    product_image: Optional[str]
    
    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    delivery_address_id: UUID
    delivery_instructions: Optional[str] = None
    coupon_code: Optional[str] = None
    notes: Optional[str] = None
    delivery_fee: Optional[Decimal] = None
    delivery_method: Optional[str] = None


class OrderResponse(BaseModel):
    id: UUID
    order_number: str
    status: str
    subtotal: Decimal
    delivery_fee: Decimal
    tax: Decimal
    discount: Decimal
    total: Decimal
    coupon_code: Optional[str]
    notes: Optional[str]
    items: List[OrderItemResponse] = []
    created_at: datetime
    confirmed_at: Optional[datetime]
    shipped_at: Optional[datetime]
    delivered_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class OrderTrackingResponse(BaseModel):
    order_id: UUID
    order_number: str
    status: str
    timeline: List[dict] = []
    delivery: Optional[dict] = None
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    order_id: UUID
    provider: str
    idempotency_key: Optional[str] = None


class PaymentResponse(BaseModel):
    id: UUID
    order_id: UUID
    provider: str
    amount: Decimal
    currency: str
    status: str
    reference: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    rating: int
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = None
    title: Optional[str] = None
    comment: Optional[str] = None


class ReviewResponse(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    rating: int
    title: Optional[str]
    comment: Optional[str]
    is_verified: bool
    helpful_count: int
    created_at: datetime
    user: Optional[dict] = None
    
    class Config:
        from_attributes = True


class CouponValidate(BaseModel):
    code: str


class CouponResponse(BaseModel):
    id: UUID
    code: str
    description: Optional[str]
    discount_type: str
    discount_value: Decimal
    minimum_order_amount: Optional[Decimal]
    maximum_discount_amount: Optional[Decimal]
    is_active: bool
    
    class Config:
        from_attributes = True


class SupportRequestCreate(BaseModel):
    order_id: Optional[UUID] = None
    subject: str
    message: str
    category: str
    priority: str = "medium"


class SupportRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    order_id: Optional[UUID]
    subject: str
    message: str
    category: str
    priority: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class SupportMessageCreate(BaseModel):
    message: str
    is_internal: bool = False


class SupportMessageResponse(BaseModel):
    id: UUID
    request_id: UUID
    sender_id: UUID
    message: str
    is_internal: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: UUID
    type: str
    title: str
    message: str
    data: Optional[str]
    is_read: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    value: str