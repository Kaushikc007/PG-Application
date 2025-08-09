from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
import json

from app.core.database import get_db
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.models import User, Property, Room, UserRole, RoomType
from app.schemas import (
    PropertyResponse,
    PropertyCreate,
    PropertyUpdate,
    RoomResponse,
    RoomCreate,
    RoomUpdate,
    PropertySearchParams,
    DashboardStats
)

router = APIRouter()

@router.post("/", response_model=PropertyResponse)
def create_property(
    property_data: PropertyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create new property (Owner only)."""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can create properties"
        )
    
    property_obj = Property(
        owner_id=current_user.id,
        **property_data.dict()
    )
    
    db.add(property_obj)
    db.commit()
    db.refresh(property_obj)
    return property_obj

@router.get("/", response_model=List[PropertyResponse])
def get_properties(
    skip: int = 0,
    limit: int = 100,
    city: Optional[str] = None,
    state: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_available: Optional[bool] = True,
    db: Session = Depends(get_db)
) -> Any:
    """Get all properties with optional filters."""
    query = db.query(Property)
    
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Property.state.ilike(f"%{state}%"))
    if min_price:
        query = query.filter(Property.price_per_month >= min_price)
    if max_price:
        query = query.filter(Property.price_per_month <= max_price)
    if is_available is not None:
        query = query.filter(Property.is_available == is_available)
    
    properties = query.offset(skip).limit(limit).all()
    return properties

@router.get("/search", response_model=List[PropertyResponse])
def search_properties(
    city: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    amenities: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
) -> Any:
    """Search properties with advanced filters."""
    query = db.query(Property).filter(Property.is_available == True)
    
    if city:
        query = query.filter(Property.city.ilike(f"%{city}%"))
    if state:
        query = query.filter(Property.state.ilike(f"%{state}%"))
    if min_price:
        query = query.filter(Property.price_per_month >= min_price)
    if max_price:
        query = query.filter(Property.price_per_month <= max_price)
    if amenities:
        # Search in amenities JSON field
        query = query.filter(Property.amenities.contains(amenities))
    
    skip = (page - 1) * size
    properties = query.offset(skip).limit(size).all()
    return properties

@router.get("/my-properties", response_model=List[PropertyResponse])
def get_my_properties(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's properties (Owner only)."""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owners can view their properties"
        )
    
    properties = db.query(Property).filter(Property.owner_id == current_user.id).all()
    return properties

@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(
    property_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """Get property by ID."""
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    return property_obj

@router.put("/{property_id}", response_model=PropertyResponse)
def update_property(
    property_id: str,
    property_update: PropertyUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update property (Owner only)."""
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check if user owns the property
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = property_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(property_obj, field, value)
    
    db.commit()
    db.refresh(property_obj)
    return property_obj

@router.delete("/{property_id}")
def delete_property(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete property (Owner only)."""
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check if user owns the property
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(property_obj)
    db.commit()
    return {"message": "Property deleted successfully"}

# Room endpoints
@router.post("/{property_id}/rooms", response_model=RoomResponse)
def create_room(
    property_id: str,
    room_data: RoomCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create room for property (Owner only)."""
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check if user owns the property
    if property_obj.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    room = Room(
        property_id=property_id,
        **room_data.dict(exclude={"property_id"})
    )
    
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.get("/{property_id}/rooms", response_model=List[RoomResponse])
def get_property_rooms(
    property_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """Get all rooms for a property."""
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    rooms = db.query(Room).filter(Room.property_id == property_id).all()
    return rooms

@router.get("/{property_id}/rooms/{room_id}", response_model=RoomResponse)
def get_room(
    property_id: str,
    room_id: str,
    db: Session = Depends(get_db)
) -> Any:
    """Get specific room."""
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.property_id == property_id
    ).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return room

@router.put("/{property_id}/rooms/{room_id}", response_model=RoomResponse)
def update_room(
    property_id: str,
    room_id: str,
    room_update: RoomUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update room (Owner only)."""
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.property_id == property_id
    ).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if user owns the property
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = room_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(room, field, value)
    
    db.commit()
    db.refresh(room)
    return room

@router.delete("/{property_id}/rooms/{room_id}")
def delete_room(
    property_id: str,
    room_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete room (Owner only)."""
    room = db.query(Room).filter(
        Room.id == room_id,
        Room.property_id == property_id
    ).first()
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    # Check if user owns the property
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(room)
    db.commit()
    return {"message": "Room deleted successfully"}

@router.get("/{property_id}/stats", response_model=DashboardStats)
def get_property_stats(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get property statistics (Owner only)."""
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check if user owns the property
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Calculate stats (simplified version)
    from app.models import Application, Tenant, Payment
    
    total_applications = db.query(Application).filter(Application.property_id == property_id).count()
    total_tenants = db.query(Tenant).filter(
        Tenant.property_id == property_id,
        Tenant.is_active == True
    ).count()
    
    # Calculate monthly revenue (simplified)
    monthly_revenue = db.query(Payment).filter(
        Payment.property_id == property_id,
        Payment.status == "PAID"
    ).count() * property_obj.price_per_month  # Simplified calculation
    
    occupancy_rate = (total_tenants / property_obj.total_rooms) * 100 if property_obj.total_rooms > 0 else 0
    
    return DashboardStats(
        total_properties=1,
        total_tenants=total_tenants,
        total_applications=total_applications,
        monthly_revenue=monthly_revenue,
        occupancy_rate=occupancy_rate
    )
