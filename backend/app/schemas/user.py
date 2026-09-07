from datetime import datetime
from typing import Optional, Any, List
from uuid import UUID
from pydantic import BaseModel, EmailStr


class ResponseModel(BaseModel):
    success: bool = True
    data: Any = None
    message: str = "Success"
    meta: Optional[dict] = None


class ErrorResponseModel(BaseModel):
    success: bool = False
    message: str = "Request failed"
    errors: List[dict] = []


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    total_pages: int
    has_next: bool
    has_previous: bool


class UserCreate(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str
    first_name: str
    last_name: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    phone: Optional[str]
    first_name: str
    last_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class AddressCreate(BaseModel):
    label: str
    first_name: str
    last_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    country: str = "Nigeria"
    is_default: bool = False


class AddressUpdate(BaseModel):
    label: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(BaseModel):
    id: UUID
    label: str
    first_name: str
    last_name: str
    phone: str
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    postal_code: str
    country: str
    is_default: bool
    
    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class LogoutRequest(BaseModel):
    refresh_token: Optional[str] = None


class VerifyEmailRequest(BaseModel):
    token: str