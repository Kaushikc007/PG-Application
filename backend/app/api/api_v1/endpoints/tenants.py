from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.database import get_db
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.models import User, Tenant, Property, UserRole
from app.schemas import (
    TenantResponse,
    TenantCreate,
    TenantUpdate
)

router = APIRouter()

@router.post("/", response_model=TenantResponse)
def create_tenant(
    tenant_data: TenantCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create new tenant record (Owner/Admin only)."""
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if property exists
    property_obj = db.query(Property).filter(Property.id == tenant_data.property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check if user owns the property (unless admin)
    if current_user.role == UserRole.OWNER and property_obj.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if user exists
    tenant_user = db.query(User).filter(User.id == tenant_data.user_id).first()
    if not tenant_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if tenant record already exists for this user and property
    existing_tenant = db.query(Tenant).filter(
        Tenant.user_id == tenant_data.user_id,
        Tenant.property_id == tenant_data.property_id,
        Tenant.is_active == True
    ).first()
    
    if existing_tenant:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Active tenant record already exists for this user and property"
        )
    
    tenant = Tenant(**tenant_data.dict())
    
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant

@router.get("/", response_model=List[TenantResponse])
def get_tenants(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get tenants based on user role."""
    if current_user.role == UserRole.TENANT:
        # Tenants see only their own records
        tenants = db.query(Tenant).filter(
            Tenant.user_id == current_user.id
        ).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.OWNER:
        # Owners see tenants for their properties
        tenants = db.query(Tenant).join(Property).filter(
            Property.owner_id == current_user.id
        ).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.ADMIN:
        # Admins see all tenants
        tenants = db.query(Tenant).offset(skip).limit(limit).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return tenants

@router.get("/my-tenancies", response_model=List[TenantResponse])
def get_my_tenancies(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's tenant records."""
    tenants = db.query(Tenant).filter(
        Tenant.user_id == current_user.id
    ).all()
    
    return tenants

@router.get("/property/{property_id}", response_model=List[TenantResponse])
def get_property_tenants(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get tenants for a specific property (Owner/Admin only)."""
    # Check if property exists
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.OWNER and property_obj.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    elif current_user.role == UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    tenants = db.query(Tenant).filter(
        Tenant.property_id == property_id
    ).all()
    
    return tenants

@router.get("/{tenant_id}", response_model=TenantResponse)
def get_tenant(
    tenant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get tenant by ID."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        if tenant.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == tenant.property_id).first()
        if property_obj.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return tenant

@router.put("/{tenant_id}", response_model=TenantResponse)
def update_tenant(
    tenant_id: str,
    tenant_update: TenantUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update tenant record."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        if tenant.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == tenant.property_id).first()
        if property_obj.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    update_data = tenant_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tenant, field, value)
    
    db.commit()
    db.refresh(tenant)
    return tenant

@router.delete("/{tenant_id}")
def delete_tenant(
    tenant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete tenant record (Owner/Admin only)."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == tenant.property_id).first()
        if property_obj.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(tenant)
    db.commit()
    return {"message": "Tenant record deleted successfully"}

@router.post("/{tenant_id}/move-out")
def move_out_tenant(
    tenant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mark tenant as moved out."""
    tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        if tenant.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == tenant.property_id).first()
        if property_obj.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    from datetime import datetime
    tenant.move_out_date = datetime.utcnow()
    tenant.is_active = False
    
    db.commit()
    db.refresh(tenant)
    
    return {"message": "Tenant moved out successfully", "tenant": tenant}
