from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any

from app.core.database import get_db
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.models import User, Application, Property, UserRole, ApplicationStatus
from app.schemas import (
    ApplicationResponse,
    ApplicationCreate,
    ApplicationUpdate
)

router = APIRouter()

@router.post("/", response_model=ApplicationResponse)
def create_application(
    application_data: ApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create new application (Tenant only)."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenants can create applications"
        )
    
    # Check if property exists
    property_obj = db.query(Property).filter(Property.id == application_data.property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    # Check if application already exists
    existing_application = db.query(Application).filter(
        Application.tenant_id == current_user.id,
        Application.property_id == application_data.property_id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application already exists for this property"
        )
    
    application = Application(
        tenant_id=current_user.id,
        **application_data.dict()
    )
    
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.get("/", response_model=List[ApplicationResponse])
def get_applications(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get applications based on user role."""
    if current_user.role == UserRole.TENANT:
        # Tenants see their own applications
        applications = db.query(Application).filter(
            Application.tenant_id == current_user.id
        ).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.OWNER:
        # Owners see applications for their properties
        applications = db.query(Application).join(Property).filter(
            Property.owner_id == current_user.id
        ).offset(skip).limit(limit).all()
    elif current_user.role == UserRole.ADMIN:
        # Admins see all applications
        applications = db.query(Application).offset(skip).limit(limit).all()
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    return applications

@router.get("/my-applications", response_model=List[ApplicationResponse])
def get_my_applications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's applications (Tenant only)."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenants can view their applications"
        )
    
    applications = db.query(Application).filter(
        Application.tenant_id == current_user.id
    ).all()
    
    return applications

@router.get("/property/{property_id}", response_model=List[ApplicationResponse])
def get_property_applications(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get applications for a specific property (Owner only)."""
    # Check if property exists and user owns it
    property_obj = db.query(Property).filter(Property.id == property_id).first()
    if not property_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found"
        )
    
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    applications = db.query(Application).filter(
        Application.property_id == property_id
    ).all()
    
    return applications

@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get application by ID."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        if application.tenant_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == application.property_id).first()
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
    
    return application

@router.put("/{application_id}", response_model=ApplicationResponse)
def update_application(
    application_id: str,
    application_update: ApplicationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        if application.tenant_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        # Tenants can only update message, not status
        if application_update.status is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenants cannot update application status"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == application.property_id).first()
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
    
    update_data = application_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(application, field, value)
    
    db.commit()
    db.refresh(application)
    return application

@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete application."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check permissions - only the tenant who created it or admin can delete
    if current_user.role == UserRole.TENANT:
        if application.tenant_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    db.delete(application)
    db.commit()
    return {"message": "Application deleted successfully"}

@router.post("/{application_id}/approve")
def approve_application(
    application_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Approve application (Owner only)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if user owns the property
    property_obj = db.query(Property).filter(Property.id == application.property_id).first()
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    application.status = ApplicationStatus.APPROVED
    db.commit()
    db.refresh(application)
    
    return {"message": "Application approved successfully", "application": application}

@router.post("/{application_id}/reject")
def reject_application(
    application_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Reject application (Owner only)."""
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    # Check if user owns the property
    property_obj = db.query(Property).filter(Property.id == application.property_id).first()
    if property_obj.owner_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    application.status = ApplicationStatus.REJECTED
    db.commit()
    db.refresh(application)
    
    return {"message": "Application rejected successfully", "application": application}
