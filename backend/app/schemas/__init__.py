from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from app.models import UserRole, ApplicationStatus, RoomType, PaymentStatus, PaymentType

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: UserRole = UserRole.TENANT

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    image: Optional[str] = None

class UserResponse(UserBase):
    id: str
    image: Optional[str] = None
    email_verified: bool
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    phone: Optional[str] = None

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# Profile Schemas
class TenantProfileBase(BaseModel):
    age: Optional[int] = None
    occupation: Optional[str] = None
    monthly_income: Optional[float] = None
    emergency_contact: Optional[str] = None
    preferences: Optional[str] = None

class TenantProfileCreate(TenantProfileBase):
    pass

class TenantProfileUpdate(TenantProfileBase):
    pass

class TenantProfileResponse(TenantProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class OwnerProfileBase(BaseModel):
    business_name: Optional[str] = None
    business_license: Optional[str] = None
    experience_years: Optional[int] = None

class OwnerProfileCreate(OwnerProfileBase):
    pass

class OwnerProfileUpdate(OwnerProfileBase):
    pass

class OwnerProfileResponse(OwnerProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Property Schemas
class PropertyBase(BaseModel):
    title: str
    description: Optional[str] = None
    address: str
    city: str
    state: str
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_month: float
    security_deposit: Optional[float] = None
    total_rooms: int = 1
    available_rooms: int = 1
    amenities: Optional[str] = None
    rules: Optional[str] = None

class PropertyCreate(PropertyBase):
    pass

class PropertyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price_per_month: Optional[float] = None
    security_deposit: Optional[float] = None
    total_rooms: Optional[int] = None
    available_rooms: Optional[int] = None
    amenities: Optional[str] = None
    rules: Optional[str] = None
    is_available: Optional[bool] = None

class PropertyResponse(PropertyBase):
    id: str
    owner_id: str
    images: Optional[str] = None
    is_available: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

# Room Schemas
class RoomBase(BaseModel):
    room_number: str
    room_type: RoomType = RoomType.SINGLE
    capacity: int = 1
    price_per_month: float
    description: Optional[str] = None
    amenities: Optional[str] = None

class RoomCreate(RoomBase):
    property_id: str

class RoomUpdate(BaseModel):
    room_number: Optional[str] = None
    room_type: Optional[RoomType] = None
    capacity: Optional[int] = None
    current_occupancy: Optional[int] = None
    price_per_month: Optional[float] = None
    description: Optional[str] = None
    amenities: Optional[str] = None
    is_available: Optional[bool] = None

class RoomResponse(RoomBase):
    id: str
    property_id: str
    current_occupancy: int
    images: Optional[str] = None
    is_available: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# Application Schemas
class ApplicationBase(BaseModel):
    property_id: str
    room_id: Optional[str] = None
    message: Optional[str] = None
    move_in_date: Optional[datetime] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[ApplicationStatus] = None
    message: Optional[str] = None

class ApplicationResponse(ApplicationBase):
    id: str
    tenant_id: str
    status: ApplicationStatus
    created_at: datetime
    updated_at: datetime
    tenant: Optional[UserResponse] = None
    property: Optional[PropertyResponse] = None
    
    class Config:
        from_attributes = True

# Tenant Schemas
class TenantBase(BaseModel):
    property_id: str
    room_id: Optional[str] = None
    move_in_date: datetime
    security_deposit: float
    monthly_rent: float

class TenantCreate(TenantBase):
    user_id: str

class TenantUpdate(BaseModel):
    move_out_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class TenantResponse(TenantBase):
    id: str
    user_id: str
    move_out_date: Optional[datetime] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    user: Optional[UserResponse] = None
    property: Optional[PropertyResponse] = None
    room: Optional[RoomResponse] = None
    
    class Config:
        from_attributes = True

# Payment Schemas
class PaymentBase(BaseModel):
    amount: float
    due_date: datetime
    payment_type: PaymentType = PaymentType.RENT
    description: Optional[str] = None

class PaymentCreate(PaymentBase):
    tenant_id: str
    property_id: str

class PaymentUpdate(BaseModel):
    paid_date: Optional[datetime] = None
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: str
    tenant_id: str
    property_id: str
    paid_date: Optional[datetime] = None
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tenant: Optional[TenantResponse] = None
    property: Optional[PropertyResponse] = None
    
    class Config:
        from_attributes = True

# Search and Filter Schemas
class PropertySearchParams(BaseModel):
    city: Optional[str] = None
    state: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    room_type: Optional[RoomType] = None
    amenities: Optional[List[str]] = None
    page: int = 1
    size: int = 10

class DashboardStats(BaseModel):
    total_properties: int
    total_tenants: int
    total_applications: int
    monthly_revenue: float
    occupancy_rate: float

# File Upload Schema
class FileUploadResponse(BaseModel):
    filename: str
    file_path: str
    file_size: int
    upload_time: datetime
