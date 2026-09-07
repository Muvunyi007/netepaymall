import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Coupon(Base):
    __tablename__ = "coupons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    minimum_order_amount = Column(Numeric(10, 2), nullable=True)
    maximum_discount_amount = Column(Numeric(10, 2), nullable=True)
    usage_limit = Column(Integer, nullable=True)
    usage_count = Column(Integer, default=0)
    user_usage_limit = Column(Integer, nullable=True)
    start_date = Column(DateTime(timezone=True), nullable=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    applies_to = Column(String(20), default="all")
    applicable_product_ids = Column(Text, nullable=True)
    applicable_category_ids = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    usage_records = relationship("CouponUsage", back_populates="coupon")


class CouponUsage(Base):
    __tablename__ = "coupon_usage"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    coupon_id = Column(UUID(as_uuid=True), ForeignKey("coupons.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    discount_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    coupon = relationship("Coupon", back_populates="usage_records")
    user = relationship("User")
    order = relationship("Order")