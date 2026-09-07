import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Integer, Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    PACKED = "packed"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"
    REFUNDED = "refunded"


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_number = Column(String(50), unique=True, nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(SQLAlchemyEnum(OrderStatus), default=OrderStatus.PENDING)
    subtotal = Column(Numeric(10, 2), nullable=False)
    delivery_fee = Column(Numeric(10, 2), default=0)
    tax = Column(Numeric(10, 2), default=0)
    discount = Column(Numeric(10, 2), default=0)
    total = Column(Numeric(10, 2), nullable=False)
    coupon_code = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    delivery_method = Column(String(50), nullable=True, default="standard")
    delivery_address_id = Column(UUID(as_uuid=True), ForeignKey("addresses.id"), nullable=True)
    delivery_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    
    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("Payment", back_populates="order", uselist=False)
    delivery = relationship("Delivery", back_populates="order", uselist=False)
    delivery_address = relationship("Address")


class OrderItem(Base):
    __tablename__ = "order_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    variant_id = Column(UUID(as_uuid=True), ForeignKey("product_variants.id"), nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)
    product_name = Column(String(255), nullable=False)
    product_image = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESSFUL = "successful"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False)
    provider = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="NGN")
    status = Column(SQLAlchemyEnum(PaymentStatus), default=PaymentStatus.PENDING)
    reference = Column(String(100), unique=True, nullable=False, index=True)
    idempotency_key = Column(String(100), unique=True, nullable=True)
    payload = Column("metadata", Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="payment")
    transactions = relationship("PaymentTransaction", back_populates="payment")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payment_id = Column(UUID(as_uuid=True), ForeignKey("payments.id"), nullable=False)
    type = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), nullable=False)
    reference = Column(String(100), nullable=True)
    payload = Column("metadata", Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    payment = relationship("Payment", back_populates="transactions")


class PaymentWebhook(Base):
    __tablename__ = "payment_webhooks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = Column(String(50), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"


class Delivery(Base):
    __tablename__ = "delivery"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), unique=True, nullable=False)
    status = Column(SQLAlchemyEnum(DeliveryStatus), default=DeliveryStatus.PENDING)
    courier_name = Column(String(100), nullable=True)
    courier_phone = Column(String(20), nullable=True)
    tracking_number = Column(String(100), nullable=True)
    estimated_delivery = Column(DateTime(timezone=True), nullable=True)
    actual_delivery = Column(DateTime(timezone=True), nullable=True)
    delivery_zone = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    order = relationship("Order", back_populates="delivery")


class DeliveryZone(Base):
    __tablename__ = "delivery_zones"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    fee = Column(Numeric(10, 2), nullable=False)
    estimated_days = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))