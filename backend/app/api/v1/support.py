from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.support import SupportRequest, SupportMessage
from app.models.order import Order
from app.schemas.order import SupportRequestCreate, SupportRequestResponse, SupportMessageCreate, SupportMessageResponse, ResponseModel, PaginationMeta
from app.api.deps import get_current_user, require_role
from app.core.exceptions import NotFoundException, ForbiddenException
from uuid import UUID

router = APIRouter(prefix="/support", tags=["Support"])


@router.post("/requests", response_model=ResponseModel)
async def create_support_request(
    request_data: SupportRequestCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if request_data.order_id:
        order_result = await db.execute(
            select(Order).where(
                Order.id == request_data.order_id,
                Order.user_id == current_user.id
            )
        )
        if not order_result.scalar_one_or_none():
            raise NotFoundException("Order not found")
    
    support_request = SupportRequest(
        user_id=current_user.id,
        order_id=request_data.order_id,
        subject=request_data.subject,
        message=request_data.message,
        category=request_data.category,
        priority=request_data.priority,
        status="open"
    )
    db.add(support_request)
    await db.flush()
    
    first_message = SupportMessage(
        request_id=support_request.id,
        sender_id=current_user.id,
        message=request_data.message
    )
    db.add(first_message)
    await db.flush()
    
    return ResponseModel(
        data=SupportRequestResponse.model_validate(support_request),
        message="Support request created successfully"
    )


@router.get("/requests", response_model=ResponseModel)
async def list_support_requests(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(SupportRequest).where(SupportRequest.user_id == current_user.id)
    count_query = select(func.count(SupportRequest.id)).where(SupportRequest.user_id == current_user.id)
    
    if status:
        query = query.where(SupportRequest.status == status)
        count_query = count_query.where(SupportRequest.status == status)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar()
    
    query = query.order_by(SupportRequest.created_at.desc())
    
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    
    result = await db.execute(query)
    requests = result.scalars().all()
    
    total_pages = (total + limit - 1) // limit
    
    return ResponseModel(
        data=[SupportRequestResponse.model_validate(req) for req in requests],
        meta=PaginationMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1
        ).model_dump()
    )


@router.get("/requests/{request_id}", response_model=ResponseModel)
async def get_support_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportRequest).where(
            SupportRequest.id == request_id,
            SupportRequest.user_id == current_user.id
        )
    )
    support_request = result.scalar_one_or_none()
    
    if not support_request:
        raise NotFoundException("Support request not found")
    
    messages_result = await db.execute(
        select(SupportMessage).where(
            SupportMessage.request_id == request_id,
            SupportMessage.is_internal == False
        ).order_by(SupportMessage.created_at)
    )
    messages = messages_result.scalars().all()
    
    return ResponseModel(
        data={
            "request": SupportRequestResponse.model_validate(support_request),
            "messages": [SupportMessageResponse.model_validate(msg) for msg in messages]
        }
    )


@router.post("/requests/{request_id}/messages", response_model=ResponseModel)
async def add_support_message(
    request_id: UUID,
    message_data: SupportMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(SupportRequest).where(
            SupportRequest.id == request_id,
            SupportRequest.user_id == current_user.id
        )
    )
    support_request = result.scalar_one_or_none()
    
    if not support_request:
        raise NotFoundException("Support request not found")
    
    if support_request.status == "resolved":
        support_request.status = "open"
    
    message = SupportMessage(
        request_id=request_id,
        sender_id=current_user.id,
        message=message_data.message,
        is_internal=False
    )
    db.add(message)
    await db.flush()
    
    return ResponseModel(
        data=SupportMessageResponse.model_validate(message),
        message="Message sent successfully"
    )