from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Any, Optional
from datetime import datetime

from app.core.database import get_db
from app.api.api_v1.endpoints.auth import get_current_active_user
from app.models import User, Payment, Tenant, Property, UserRole, PaymentStatus
from app.schemas import (
    PaymentResponse,
    PaymentCreate,
    PaymentUpdate
)

router = APIRouter()

@router.post("/", response_model=PaymentResponse)
def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create new payment record (Owner/Admin only)."""
    if current_user.role not in [UserRole.OWNER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    # Check if tenant exists
    tenant = db.query(Tenant).filter(Tenant.id == payment_data.tenant_id).first()
    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tenant not found"
        )
    
    # Check if property exists
    property_obj = db.query(Property).filter(Property.id == payment_data.property_id).first()
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
    
    payment = Payment(**payment_data.dict())
    
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment

@router.get("/", response_model=List[PaymentResponse])
def get_payments(
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[PaymentStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get payments based on user role."""
    query = db.query(Payment)
    
    if current_user.role == UserRole.TENANT:
        # Tenants see payments for their tenancies
        query = query.join(Tenant).filter(Tenant.user_id == current_user.id)
    elif current_user.role == UserRole.OWNER:
        # Owners see payments for their properties
        query = query.join(Property).filter(Property.owner_id == current_user.id)
    elif current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    
    payments = query.offset(skip).limit(limit).all()
    return payments

@router.get("/my-payments", response_model=List[PaymentResponse])
def get_my_payments(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get current user's payments (Tenant only)."""
    if current_user.role != UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only tenants can view their payments"
        )
    
    payments = db.query(Payment).join(Tenant).filter(
        Tenant.user_id == current_user.id
    ).all()
    
    return payments

@router.get("/property/{property_id}", response_model=List[PaymentResponse])
def get_property_payments(
    property_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get payments for a specific property (Owner/Admin only)."""
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
    
    payments = db.query(Payment).filter(
        Payment.property_id == property_id
    ).all()
    
    return payments

@router.get("/tenant/{tenant_id}", response_model=List[PaymentResponse])
def get_tenant_payments(
    tenant_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get payments for a specific tenant."""
    # Check if tenant exists
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
    
    payments = db.query(Payment).filter(
        Payment.tenant_id == tenant_id
    ).all()
    
    return payments

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get payment by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
        if tenant.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == payment.property_id).first()
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
    
    return payment

@router.put("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: str,
    payment_update: PaymentUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update payment record."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
        if tenant.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        # Tenants can only mark payments as paid
        if payment_update.status and payment_update.status != PaymentStatus.PAID:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tenants can only mark payments as paid"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == payment.property_id).first()
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
    
    update_data = payment_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(payment, field, value)
    
    db.commit()
    db.refresh(payment)
    return payment

@router.delete("/{payment_id}")
def delete_payment(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Delete payment record (Owner/Admin only)."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == payment.property_id).first()
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
    
    db.delete(payment)
    db.commit()
    return {"message": "Payment record deleted successfully"}

@router.post("/{payment_id}/mark-paid")
def mark_payment_paid(
    payment_id: str,
    transaction_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mark payment as paid."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    # Check permissions
    if current_user.role == UserRole.TENANT:
        tenant = db.query(Tenant).filter(Tenant.id == payment.tenant_id).first()
        if tenant.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
    elif current_user.role == UserRole.OWNER:
        property_obj = db.query(Property).filter(Property.id == payment.property_id).first()
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
    
    payment.status = PaymentStatus.PAID
    payment.paid_date = datetime.utcnow()
    if transaction_id:
        payment.transaction_id = transaction_id
    
    db.commit()
    db.refresh(payment)
    
    return {"message": "Payment marked as paid successfully", "payment": payment}

@router.get("/stats/revenue")
def get_revenue_stats(
    property_id: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get revenue statistics (Owner/Admin only)."""
    if current_user.role == UserRole.TENANT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    
    query = db.query(Payment).filter(Payment.status == PaymentStatus.PAID)
    
    if current_user.role == UserRole.OWNER:
        if property_id:
            # Check if user owns the property
            property_obj = db.query(Property).filter(Property.id == property_id).first()
            if not property_obj or property_obj.owner_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions"
                )
            query = query.filter(Payment.property_id == property_id)
        else:
            # Get revenue for all owner's properties
            query = query.join(Property).filter(Property.owner_id == current_user.id)
    elif property_id:
        query = query.filter(Payment.property_id == property_id)
    
    payments = query.all()
    
    total_revenue = sum(payment.amount for payment in payments)
    total_payments = len(payments)
    
    # Calculate monthly revenue (last 30 days)
    from datetime import datetime, timedelta
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    monthly_payments = [p for p in payments if p.paid_date and p.paid_date >= thirty_days_ago]
    monthly_revenue = sum(payment.amount for payment in monthly_payments)
    
    return {
        "total_revenue": total_revenue,
        "total_payments": total_payments,
        "monthly_revenue": monthly_revenue,
        "monthly_payments": len(monthly_payments)
    }
