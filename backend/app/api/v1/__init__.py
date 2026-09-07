from fastapi import APIRouter
from app.api.v1 import auth, users, products, categories, cart, orders, payments, reviews, coupons, notifications, support, admin

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(products.router)
api_router.include_router(categories.router)
api_router.include_router(cart.router)
api_router.include_router(orders.router)
api_router.include_router(payments.router)
api_router.include_router(reviews.router)
api_router.include_router(coupons.router)
api_router.include_router(notifications.router)
api_router.include_router(support.router)
api_router.include_router(admin.router)