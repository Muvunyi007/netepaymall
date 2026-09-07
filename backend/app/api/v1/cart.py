from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.models.cart import Cart, CartItem, Wishlist, WishlistItem
from app.models.product import Product, ProductVariant, Inventory
from app.models.coupon import Coupon
from app.schemas.cart import (
    CartItemAdd, CartItemUpdate, CartItemResponse,
    CartResponse, WishlistItemAdd, WishlistItemResponse, WishlistResponse
)
from app.schemas.order import ResponseModel
from app.api.deps import get_current_user, get_optional_user
from app.core.exceptions import NotFoundException, BadRequestException
from uuid import UUID
from decimal import Decimal

router = APIRouter(tags=["Cart & Wishlist"])


@router.get("/cart", response_model=ResponseModel)
async def get_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Cart)
        .options(
            selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
            selectinload(Cart.items).selectinload(CartItem.variant),
        )
        .where(Cart.user_id == current_user.id)
    )
    cart = result.scalar_one_or_none()
    
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        await db.flush()
    
    cart_items = []
    subtotal = Decimal("0")
    
    for item in cart.items:
        product = item.product
        price = product.price
        if item.variant and item.variant.price:
            price = item.variant.price
        
        item_total = price * item.quantity
        subtotal += item_total
        
        cart_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "saved_for_later": item.saved_for_later,
            "product": {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "compare_price": product.compare_price,
                "images": [{"url": img.url, "alt_text": img.alt_text} for img in product.images[:1]]
            },
            "variant": {
                "id": item.variant.id,
                "name": item.variant.name,
                "price": item.variant.price
            } if item.variant else None
        })
    
    discount = Decimal("0")
    delivery_fee = Decimal("0")
    tax = Decimal("0")
    
    if cart.coupon_code:
        from app.models.coupon import Coupon
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.code == cart.coupon_code, Coupon.is_active == True)
        )
        coupon = coupon_result.scalar_one_or_none()
        if coupon:
            if coupon.discount_type == "percentage":
                discount = min(subtotal * coupon.discount_value / 100, coupon.maximum_discount_amount or subtotal)
            else:
                discount = min(coupon.discount_value, subtotal)
    
    total = subtotal - discount + delivery_fee + tax
    
    return ResponseModel(
        data={
            "id": cart.id,
            "items": cart_items,
            "coupon_code": cart.coupon_code,
            "subtotal": float(subtotal),
            "discount": float(discount),
            "delivery_fee": float(delivery_fee),
            "tax": float(tax),
            "total": float(total)
        }
    )


@router.post("/cart/items", response_model=ResponseModel)
async def add_to_cart(
    item_data: CartItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Cart).where(Cart.user_id == current_user.id)
    )
    cart = result.scalar_one_or_none()
    
    if not cart:
        cart = Cart(user_id=current_user.id)
        db.add(cart)
        await db.flush()
    
    product_result = await db.execute(
        select(Product).where(Product.id == item_data.product_id, Product.is_active == True)
    )
    product = product_result.scalar_one_or_none()
    
    if not product:
        raise NotFoundException("Product not found")
    
    if item_data.variant_id:
        variant_result = await db.execute(
            select(ProductVariant).where(
                ProductVariant.id == item_data.variant_id,
                ProductVariant.product_id == item_data.product_id
            )
        )
        if not variant_result.scalar_one_or_none():
            raise NotFoundException("Product variant not found")
    
    existing_item_result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id,
            CartItem.product_id == item_data.product_id,
            CartItem.variant_id == item_data.variant_id
        )
    )
    existing_item = existing_item_result.scalar_one_or_none()
    
    if existing_item:
        existing_item.quantity += item_data.quantity
    else:
        cart_item = CartItem(
            cart_id=cart.id,
            product_id=item_data.product_id,
            variant_id=item_data.variant_id,
            quantity=item_data.quantity
        )
        db.add(cart_item)
    
    await db.flush()
    return ResponseModel(message="Item added to cart")


@router.patch("/cart/items/{item_id}", response_model=ResponseModel)
async def update_cart_item(
    item_id: UUID,
    update_data: CartItemUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CartItem).join(Cart).where(
            CartItem.id == item_id,
            Cart.user_id == current_user.id
        )
    )
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise NotFoundException("Cart item not found")
    
    if update_data.quantity <= 0:
        await db.delete(cart_item)
    else:
        cart_item.quantity = update_data.quantity
    
    await db.flush()
    return ResponseModel(message="Cart item updated")


@router.delete("/cart/items/{item_id}")
async def remove_from_cart(
    item_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(CartItem).join(Cart).where(
            CartItem.id == item_id,
            Cart.user_id == current_user.id
        )
    )
    cart_item = result.scalar_one_or_none()
    
    if not cart_item:
        raise NotFoundException("Cart item not found")
    
    await db.delete(cart_item)
    return {"message": "Item removed from cart"}


@router.post("/cart/apply-coupon", response_model=ResponseModel)
async def apply_coupon_to_cart(
    coupon_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    code = coupon_data.get("code", "").upper()
    if not code:
        raise BadRequestException("Coupon code is required")

    result = await db.execute(
        select(Cart).where(Cart.user_id == current_user.id)
    )
    cart = result.scalar_one_or_none()

    if not cart:
        raise NotFoundException("Cart not found")

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    coupon_result = await db.execute(
        select(Coupon).where(Coupon.code == code, Coupon.is_active == True)
    )
    coupon = coupon_result.scalar_one_or_none()

    if not coupon:
        raise NotFoundException("Invalid coupon code")

    if coupon.start_date and coupon.start_date > now:
        raise BadRequestException("Coupon is not yet active")

    if coupon.end_date and coupon.end_date < now:
        raise BadRequestException("Coupon has expired")

    if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
        raise BadRequestException("Coupon usage limit reached")

    cart.coupon_code = code
    await db.flush()

    return ResponseModel(data={"code": code}, message="Coupon applied to cart")


@router.delete("/cart/coupon", response_model=ResponseModel)
async def remove_coupon_from_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Cart).where(Cart.user_id == current_user.id)
    )
    cart = result.scalar_one_or_none()

    if cart:
        cart.coupon_code = None
        await db.flush()

    return ResponseModel(message="Coupon removed from cart")


@router.delete("/cart")
async def clear_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Cart)
        .options(selectinload(Cart.items))
        .where(Cart.user_id == current_user.id)
    )
    cart = result.scalar_one_or_none()
    
    if cart:
        for item in cart.items:
            await db.delete(item)
        cart.coupon_code = None
    
    return {"message": "Cart cleared"}


@router.get("/wishlist", response_model=ResponseModel)
async def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Wishlist)
        .options(
            selectinload(Wishlist.items).selectinload(WishlistItem.product).selectinload(Product.images),
        )
        .where(Wishlist.user_id == current_user.id)
    )
    wishlist = result.scalar_one_or_none()
    
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        await db.flush()
    
    wishlist_items = []
    for item in wishlist.items:
        product = item.product
        wishlist_items.append({
            "id": item.id,
            "product_id": item.product_id,
            "product": {
                "id": product.id,
                "name": product.name,
                "price": product.price,
                "compare_price": product.compare_price,
                "images": [{"url": img.url, "alt_text": img.alt_text} for img in product.images[:1]]
            },
            "created_at": item.created_at
        })
    
    return ResponseModel(
        data={
            "id": wishlist.id,
            "items": wishlist_items
        }
    )


@router.post("/wishlist/items", response_model=ResponseModel)
async def add_to_wishlist(
    item_data: WishlistItemAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Wishlist).where(Wishlist.user_id == current_user.id)
    )
    wishlist = result.scalar_one_or_none()
    
    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        await db.flush()
    
    product_result = await db.execute(
        select(Product).where(Product.id == item_data.product_id, Product.is_active == True)
    )
    if not product_result.scalar_one_or_none():
        raise NotFoundException("Product not found")
    
    existing = await db.execute(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == item_data.product_id
        )
    )
    if existing.scalar_one_or_none():
        return ResponseModel(message="Product already in wishlist")
    
    wishlist_item = WishlistItem(
        wishlist_id=wishlist.id,
        product_id=item_data.product_id
    )
    db.add(wishlist_item)
    await db.flush()
    
    return ResponseModel(message="Product added to wishlist")


@router.delete("/wishlist/items/{product_id}")
async def remove_from_wishlist(
    product_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Wishlist).where(Wishlist.user_id == current_user.id)
    )
    wishlist = result.scalar_one_or_none()
    
    if not wishlist:
        raise NotFoundException("Wishlist not found")
    
    item_result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        )
    )
    item = item_result.scalar_one_or_none()
    
    if not item:
        raise NotFoundException("Product not in wishlist")
    
    await db.delete(item)
    return {"message": "Product removed from wishlist"}