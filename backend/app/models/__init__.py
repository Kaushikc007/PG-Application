from sqlalchemy import Column, String, DateTime, Boolean, Text, Integer, Float, ForeignKey, Enum as SQLEnum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from datetime import datetime
import uuid

Base = declarative_base()

class UserRole(str, enum.Enum):
    TENANT = "TENANT"
    OWNER = "OWNER"
    ADMIN = "ADMIN"

class ApplicationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class RoomType(str, enum.Enum):
    SINGLE = "SINGLE"
    DOUBLE = "DOUBLE"
    TRIPLE = "TRIPLE"
    SHARING = "SHARING"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    OVERDUE = "OVERDUE"
    CANCELLED = "CANCELLED"

class PaymentType(str, enum.Enum):
    RENT = "RENT"
    SECURITY_DEPOSIT = "SECURITY_DEPOSIT"
    MAINTENANCE = "MAINTENANCE"
    ELECTRICITY = "ELECTRICITY"
    OTHER = "OTHER"

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    password = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.TENANT)
    phone = Column(String)
    address = Column(Text)
    image = Column(String)
    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant_profile = relationship("TenantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    owner_profile = relationship("OwnerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    properties = relationship("Property", back_populates="owner", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="tenant", cascade="all, delete-orphan")
    tenancies = relationship("Tenant", back_populates="user", cascade="all, delete-orphan")

class TenantProfile(Base):
    __tablename__ = "tenant_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    age = Column(Integer)
    occupation = Column(String)
    monthly_income = Column(Float)
    emergency_contact = Column(String)
    preferences = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tenant_profile")

class OwnerProfile(Base):
    __tablename__ = "owner_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    business_name = Column(String)
    business_license = Column(String)
    experience_years = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="owner_profile")

class Property(Base):
    __tablename__ = "properties"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    owner_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False)
    description = Column(Text)
    address = Column(Text, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    price_per_month = Column(Float, nullable=False)
    security_deposit = Column(Float)
    total_rooms = Column(Integer, default=1)
    available_rooms = Column(Integer, default=1)
    amenities = Column(Text)  # JSON string
    rules = Column(Text)
    images = Column(Text)  # JSON string of image URLs
    is_available = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="properties")
    rooms = relationship("Room", back_populates="property", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="property", cascade="all, delete-orphan")
    tenancies = relationship("Tenant", back_populates="property", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="property", cascade="all, delete-orphan")

class Room(Base):
    __tablename__ = "rooms"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    property_id = Column(String, ForeignKey("properties.id"))
    room_number = Column(String, nullable=False)
    room_type = Column(SQLEnum(RoomType), default=RoomType.SINGLE)
    capacity = Column(Integer, default=1)
    current_occupancy = Column(Integer, default=0)
    price_per_month = Column(Float, nullable=False)
    description = Column(Text)
    amenities = Column(Text)  # JSON string
    images = Column(Text)  # JSON string
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    property = relationship("Property", back_populates="rooms")
    tenancies = relationship("Tenant", back_populates="room")

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("users.id"))
    property_id = Column(String, ForeignKey("properties.id"))
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING)
    message = Column(Text)
    move_in_date = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("User", back_populates="applications")
    property = relationship("Property", back_populates="applications")

class Tenant(Base):
    __tablename__ = "tenants"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    property_id = Column(String, ForeignKey("properties.id"))
    room_id = Column(String, ForeignKey("rooms.id"), nullable=True)
    move_in_date = Column(DateTime)
    move_out_date = Column(DateTime, nullable=True)
    security_deposit = Column(Float)
    monthly_rent = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tenancies")
    property = relationship("Property", back_populates="tenancies")
    room = relationship("Room", back_populates="tenancies")
    payments = relationship("Payment", back_populates="tenant", cascade="all, delete-orphan")

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    tenant_id = Column(String, ForeignKey("tenants.id"))
    property_id = Column(String, ForeignKey("properties.id"))
    amount = Column(Float, nullable=False)
    due_date = Column(DateTime)
    paid_date = Column(DateTime, nullable=True)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)
    payment_type = Column(SQLEnum(PaymentType), default=PaymentType.RENT)
    description = Column(Text)
    transaction_id = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="payments")
    property = relationship("Property", back_populates="payments")
