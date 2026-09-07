import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Numeric, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base


class Category(Base):
    __tablename__ = "categories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    parent = relationship("Category", remote_side=[id], backref="subcategories")
    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(280), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    short_description = Column(String(500), nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    compare_price = Column(Numeric(10, 2), nullable=True)
    cost_price = Column(Numeric(10, 2), nullable=True)
    sku = Column(String(100), unique=True, nullable=True, index=True)
    barcode = Column(String(100), nullable=True)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)
    brand = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)
    is_digital = Column(Boolean, default=False)
    weight = Column(Numeric(8, 2), nullable=True)
    meta_title = Column(String(200), nullable=True)
    meta_description = Column(Text, nullable=True)
    tags = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    __table_args__ = (
        Index("idx_products_category", "category_id"),
        Index("idx_products_featured", "is_featured"),
        Index("idx_products_active", "is_active"),
    )
    
    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    inventory = relationship("Inventory", back_populates="product", uselist=False)
    reviews = relationship("Review", back_populates="product")


class ProductImage(Base):
    __tablename__ = "product_images"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    url = Column(String(500), nullable=False)
    alt_text = Column(String(255), nullable=True)
    sort_order = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    __tablename__ = "product_variants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)
    name = Column(String(100), nullable=False)
    sku = Column(String(100), unique=True, nullable=True)
    price = Column(Numeric(10, 2), nullable=True)
    compare_price = Column(Numeric(10, 2), nullable=True)
    options = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    product = relationship("Product", back_populates="variants")


class Inventory(Base):
    __tablename__ = "inventory"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), unique=True, nullable=False)
    quantity = Column(Integer, default=0)
    reserved = Column(Integer, default=0)
    low_stock_threshold = Column(Integer, default=10)
    track_inventory = Column(Boolean, default=True)
    allow_backorder = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    product = relationship("Product", back_populates="inventory")