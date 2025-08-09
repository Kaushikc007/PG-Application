from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.database import get_db
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.models import User, TenantProfile, OwnerProfile, UserRole
from app.schemas import (
    UserResponse, 
    UserUpdate,
    TenantProfileCreate,
    TenantProfileUpdate,
    TenantProfileResponse,
    OwnerProfileCreate,
    OwnerProfileUpdate,
    OwnerProfileResponse
)

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get all users (Admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/me", response_model=UserResponse)
def get_current_user(current_user: User = Depends(get_current_active_user)) -> Any:
    """Get current user profile."""
    return current_user

@router.put("/me", response_model=UserResponse)
def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current user profile."""
    update_data = user_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Get user by ID."""
    # Users can view their own profile, or admins can view any profile
    if current_user.id != user_id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Any:
    """Delete user (Admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

# Tenant Profile endpoints
@router.post("/tenant-profile", response_model=TenantProfileResponse)
def create_tenant_profile(
    profile_data: TenantProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create tenant profile for current user."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only tenants can create tenant profiles"
        )
    
    # Check if profile already exists
    existing_profile = db.query(TenantProfile).filter(TenantProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tenant profile already exists"
        )
    
    profile = TenantProfile(
        user_id=current_user.id,
        **profile_data.dict()
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/tenant-profile", response_model=TenantProfileResponse)
def get_tenant_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's tenant profile."""
    profile = db.query(TenantProfile).filter(TenantProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found"
        )
    
    return profile

@router.put("/tenant-profile", response_model=TenantProfileResponse)
def update_tenant_profile(
    profile_update: TenantProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current user's tenant profile."""
    profile = db.query(TenantProfile).filter(TenantProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant profile not found"
        )
    
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile

# Owner Profile endpoints
@router.post("/owner-profile", response_model=OwnerProfileResponse)
def create_owner_profile(
    profile_data: OwnerProfileCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create owner profile for current user."""
    if current_user.role != UserRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only owners can create owner profiles"
        )
    
    # Check if profile already exists
    existing_profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if existing_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner profile already exists"
        )
    
    profile = OwnerProfile(
        user_id=current_user.id,
        **profile_data.dict()
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/owner-profile", response_model=OwnerProfileResponse)
def get_owner_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's owner profile."""
    profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner profile not found"
        )
    
    return profile

@router.put("/owner-profile", response_model=OwnerProfileResponse)
def update_owner_profile(
    profile_update: OwnerProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update current user's owner profile."""
    profile = db.query(OwnerProfile).filter(OwnerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Owner profile not found"
        )
    
    update_data = profile_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)
    
    db.commit()
    db.refresh(profile)
    return profile
