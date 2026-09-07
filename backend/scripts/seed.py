"""Dev/seed script: creates tables and seeds demo data (admin, test user, categories, products).

Usage: ./.venv/bin/python -m scripts.seed
"""
import asyncio
import uuid
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.core.database import AsyncSessionLocal, engine, Base  # noqa: E402
from app.core.security import get_password_hash  # noqa: E402
from app.models.user import User, UserRole  # noqa: E402
from app.models.product import Category, Product, ProductImage, ProductVariant, Inventory  # noqa: E402


async def seed() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    admin_email = "admin@store.com"
    user_email = "user@demo.com"

    async with AsyncSessionLocal() as db:
        from sqlalchemy import select

        existing_admin = (await db.execute(select(User).where(User.email == admin_email))).scalar_one_or_none()
        if not existing_admin:
            db.add(User(
                email=admin_email,
                first_name="System",
                last_name="Admin",
                role=UserRole.SUPER_ADMIN,
                is_active=True,
                is_verified=True,
                password_hash=get_password_hash("Admin@123"),
            ))
            print(f"Created admin: {admin_email} / Admin@123")

        existing_user = (await db.execute(select(User).where(User.email == user_email))).scalar_one_or_none()
        if not existing_user:
            db.add(User(
                email=user_email,
                phone="08000000000",
                first_name="Demo",
                last_name="User",
                role=UserRole.USER,
                is_active=True,
                is_verified=True,
                password_hash=get_password_hash("Demo@123"),
            ))
            print(f"Created user: {user_email} / Demo@123")
        await db.flush()

        seed_products = [
            {
                "category": ("Electronics", "electronics", "Phones, laptops, gadgets and accessories"),
                "products": [
                    {
                        "name": "Premium Wireless Headphones",
                        "slug": "premium-wireless-headphones",
                        "description": "Over-ear Bluetooth headphones with active noise cancellation, 40-hour battery life and premium sound.",
                        "short_description": "ANC over-ear headphones, 40h battery",
                        "price": 145000,
                        "compare_price": 180000,
                        "sku": "AUD-HP-001",
                        "brand": "SoundWave",
                        "is_featured": True,
                        "qty": 25,
                    },
                    {
                        "name": "Smart Fitness Watch Pro",
                        "slug": "smart-fitness-watch-pro",
                        "description": "GPS fitness watch with heart-rate monitoring, sleep tracking and 10-day battery life.",
                        "short_description": "GPS watch, HR + sleep tracking",
                        "price": 98000,
                        "compare_price": 120000,
                        "sku": "WCH-FT-002",
                        "brand": "PulseTech",
                        "qty": 40,
                    },
                ],
            },
            {
                "category": ("Fashion", "fashion", "Clothing, shoes and accessories for every style"),
                "products": [
                    {
                        "name": "Classic Leather Sneakers",
                        "slug": "classic-leather-sneakers",
                        "description": "Minimalist leather sneakers with cushioned soles. Available in black and white.",
                        "short_description": "Minimalist leather sneakers",
                        "price": 65000,
                        "compare_price": 82000,
                        "sku": "SHO-SN-001",
                        "brand": "UrbanStep",
                        "is_featured": True,
                        "qty": 60,
                        "variants": [
                            {"name": "Black / 42", "sku": "SHO-SN-001-B42", "price": 65000, "options": '{"color":"Black","size":"42"}'},
                            {"name": "White / 42", "sku": "SHO-SN-001-W42", "price": 65000, "options": '{"color":"White","size":"42"}'},
                        ],
                    },
                ],
            },
            {
                "category": ("Home & Kitchen", "home-kitchen", "Appliances, cookware and home essentials"),
                "products": [
                    {
                        "name": "Electric Kettle 1.7L",
                        "slug": "electric-kettle-1-7l",
                        "description": "Fast-boiling 1.7L stainless steel kettle with auto shut-off and boil-dry protection.",
                        "short_description": "1.7L stainless steel, auto shut-off",
                        "price": 24000,
                        "compare_price": 30000,
                        "sku": "KIT-KT-001",
                        "brand": "HomePlus",
                        "qty": 80,
                    },
                ],
            },
        ]

        for cat_data in seed_products:
            cname, cslug, cdesc = cat_data["category"]
            existing_cat = (await db.execute(select(Category).where(Category.slug == cslug))).scalar_one_or_none()
            if not existing_cat:
                cat = Category(name=cname, slug=cslug, description=cdesc, is_active=True, sort_order=0)
                db.add(cat)
                await db.flush()
                print(f"Created category: {cname}")
            else:
                cat = existing_cat

            for p_data in cat_data["products"]:
                existing_product = (await db.execute(select(Product).where(Product.slug == p_data["slug"]))).scalar_one_or_none()
                if existing_product:
                    continue
                product = Product(
                    name=p_data["name"],
                    slug=p_data["slug"],
                    description=p_data["description"],
                    short_description=p_data["short_description"],
                    price=p_data["price"],
                    compare_price=p_data["compare_price"],
                    sku=p_data["sku"],
                    category_id=cat.id,
                    brand=p_data["brand"],
                    is_active=True,
                    is_featured=p_data.get("is_featured", False),
                    tags="",
                )
                db.add(product)
                await db.flush()

                db.add(ProductImage(
                    product_id=product.id,
                    url=f"https://images.example.com/{p_data['slug']}.jpg",
                    alt_text=p_data["name"],
                    sort_order=0,
                    is_primary=True,
                ))
                db.add(Inventory(
                    product_id=product.id,
                    quantity=p_data["qty"],
                    reserved=0,
                    low_stock_threshold=10,
                    track_inventory=True,
                    allow_backorder=False,
                ))
                for v_data in p_data.get("variants", []):
                    db.add(ProductVariant(
                        product_id=product.id,
                        name=v_data["name"],
                        sku=v_data["sku"],
                        price=v_data["price"],
                        options=v_data["options"],
                        is_active=True,
                    ))
                print(f"Created product: {p_data['name']}")

        await db.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())