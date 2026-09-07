from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, AddressCreate, AddressUpdate, AddressResponse
from app.api.deps import get_current_user
from app.core.exceptions import NotFoundException
from uuid import UUID
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.patch("/me", response_model=UserResponse)
async def update_user_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(current_user, key, value)
    
    await db.flush()
    return UserResponse.model_validate(current_user)


@router.delete("/me")
async def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from datetime import datetime, timezone
    current_user.deleted_at = datetime.now(timezone.utc)
    current_user.is_active = False
    await db.flush()
    return {"message": "Account deleted successfully"}


@router.get("/me/addresses", response_model=List[AddressResponse])
async def get_user_addresses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).options(selectinload(User.addresses)).where(User.id == current_user.id)
    )
    user = result.scalar_one()
    return [AddressResponse.model_validate(addr) for addr in user.addresses]


@router.post("/me/addresses", response_model=AddressResponse)
async def create_address(
    address_data: AddressCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.user import Address
    
    if address_data.is_default:
        for addr in current_user.addresses:
            addr.is_default = False
    
    address = Address(
        user_id=current_user.id,
        **address_data.model_dump()
    )
    
    db.add(address)
    await db.flush()
    
    return AddressResponse.model_validate(address)


@router.patch("/me/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: UUID,
    update_data: AddressUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.user import Address
    
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise NotFoundException("Address not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    
    if update_dict.get("is_default"):
        for addr in current_user.addresses:
            addr.is_default = False
    
    for key, value in update_dict.items():
        setattr(address, key, value)
    
    await db.flush()
    return AddressResponse.model_validate(address)


@router.delete("/me/addresses/{address_id}")
async def delete_address(
    address_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    from app.models.user import Address
    
    result = await db.execute(
        select(Address).where(
            Address.id == address_id,
            Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    
    if not address:
        raise NotFoundException("Address not found")
    
    await db.delete(address)
    return {"message": "Address deleted successfully"}