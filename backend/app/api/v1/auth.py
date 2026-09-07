from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    verify_password,
    get_password_hash
)
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate,
    UserResponse,
    UserUpdate,
    LoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ChangePasswordRequest,
    LogoutRequest,
    VerifyEmailRequest,
    ResponseModel
)
from app.api.deps import get_current_user
from app.core.exceptions import BadRequestException, NotFoundException, ConflictException
from datetime import datetime, timedelta, timezone
from jose import jwt
from uuid import UUID

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")
    
    if user_data.phone:
        result = await db.execute(select(User).where(User.phone == user_data.phone))
        if result.scalar_one_or_none():
            raise ConflictException("Phone number already registered")
    
    user = User(
        email=user_data.email,
        phone=user_data.phone,
        password_hash=get_password_hash(user_data.password),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        role=UserRole.USER,
        is_active=True,
        is_verified=False
    )
    
    db.add(user)
    await db.flush()
    
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == login_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated"
        )
    
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_token: str, db: AsyncSession = Depends(get_db)):
    payload = decode_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    new_access_token = create_access_token(str(user.id))
    new_refresh_token = create_refresh_token(str(user.id))
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.post("/forgot-password", response_model=ResponseModel)
async def forgot_password(
    data: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user:
        return ResponseModel(
            data=None,
            message="If the email exists, a reset link has been sent"
        )

    reset_token = create_access_token(
        str(user.id),
        timedelta(minutes=30)
    )
    reset_payload = jwt.encode(
        {"sub": str(user.id), "type": "password_reset", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)},
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return ResponseModel(
        data={"reset_token": reset_payload},
        message="Password reset token generated"
    )


@router.post("/reset-password", response_model=ResponseModel)
async def reset_password(
    data: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    payload = decode_token(data.token)

    if not payload or payload.get("type") != "password_reset":
        raise BadRequestException("Invalid or expired reset token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise NotFoundException("User not found")

    user.password_hash = get_password_hash(data.new_password)
    await db.flush()

    return ResponseModel(
        data=None,
        message="Password reset successfully"
    )


@router.post("/change-password", response_model=ResponseModel)
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise BadRequestException("Current password is incorrect")

    if data.new_password == data.current_password:
        raise BadRequestException("New password must differ from current password")

    current_user.password_hash = get_password_hash(data.new_password)
    await db.flush()

    return ResponseModel(
        data=None,
        message="Password changed successfully"
    )


@router.post("/verify-email", response_model=ResponseModel)
async def verify_email(
    data: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db)
):
    payload = decode_token(data.token)

    if not payload or payload.get("type") != "email_verification":
        raise BadRequestException("Invalid or expired verification token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()

    if not user:
        raise NotFoundException("User not found")

    user.is_verified = True
    await db.flush()

    return ResponseModel(
        data=None,
        message="Email verified successfully"
    )


@router.post("/logout", response_model=ResponseModel)
async def logout(
    data: LogoutRequest,
    current_user: User = Depends(get_current_user)
):
    return ResponseModel(
        data=None,
        message="Logged out successfully"
    )