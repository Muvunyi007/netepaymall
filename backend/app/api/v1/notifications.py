from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.schemas.order import NotificationResponse, ResponseModel, PaginationMeta
from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException
from uuid import UUID

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=ResponseModel)
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    count_query = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id
    )
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = select(Notification).where(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    notifications = result.scalars().all()
    
    unread_query = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    unread_result = await db.execute(unread_query)
    unread_count = unread_result.scalar()
    
    total_pages = (total + limit - 1) // limit
    
    return ResponseModel(
        data=[NotificationResponse.model_validate(n) for n in notifications],
        meta={
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1,
            "unread_count": unread_count
        }
    )


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise NotFoundException("Notification not found")
    
    notification.is_read = True
    return {"message": "Notification marked as read"}


@router.post("/read-all")
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    notifications = result.scalars().all()
    
    for notification in notifications:
        notification.is_read = True
    
    return {"message": "All notifications marked as read"}