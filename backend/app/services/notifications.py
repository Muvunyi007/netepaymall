"""Notification utilities used across the API to create user notifications."""
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification, NotificationType
from uuid import UUID
import json


async def create_notification(
    db: AsyncSession,
    user_id: UUID,
    type: NotificationType,
    title: str,
    message: str,
    data: dict | None = None,
) -> Notification:
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        data=json.dumps(data) if data else None,
    )
    db.add(notification)
    await db.flush()
    return notification