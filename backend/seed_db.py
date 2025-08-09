#!/usr/bin/env python3
"""
Database initialization and seeding script.
"""

import asyncio
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import Base, User, UserRole, Property, TenantProfile, OwnerProfile
from app.core.security import get_password_hash
import uuid

def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

def create_admin_user(db: Session):
    """Create default admin user."""
    admin_email = "admin@pgapp.com"
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        print(f"Admin user already exists: {admin_email}")
        return existing_admin
    
    # Create admin user
    admin_user = User(
        id=str(uuid.uuid4()),
        email=admin_email,
        name="Admin User",
        password=get_password_hash("admin123"),
        role=UserRole.ADMIN,
        phone="+1234567890",
        is_active=True,
        email_verified=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    
    print(f"Admin user created: {admin_email}")
    print(f"Password: admin123")
    return admin_user

def create_sample_owner(db: Session):
    """Create sample owner user."""
    owner_email = "owner@pgapp.com"
    
    # Check if owner already exists
    existing_owner = db.query(User).filter(User.email == owner_email).first()
    if existing_owner:
        print(f"Owner user already exists: {owner_email}")
        return existing_owner
    
    # Create owner user
    owner_user = User(
        id=str(uuid.uuid4()),
        email=owner_email,
        name="John Owner",
        password=get_password_hash("owner123"),
        role=UserRole.OWNER,
        phone="+1234567891",
        address="123 Owner Street, City, State",
        is_active=True,
        email_verified=True
    )
    
    db.add(owner_user)
    db.commit()
    db.refresh(owner_user)
    
    # Create owner profile
    owner_profile = OwnerProfile(
        id=str(uuid.uuid4()),
        user_id=owner_user.id,
        business_name="PG Properties Ltd",
        business_license="BL123456789",
        experience_years=5
    )
    
    db.add(owner_profile)
    
    print(f"Owner user created: {owner_email}")
    print(f"Password: owner123")
    return owner_user

def create_sample_tenant(db: Session):
    """Create sample tenant user."""
    tenant_email = "tenant@pgapp.com"
    
    # Check if tenant already exists
    existing_tenant = db.query(User).filter(User.email == tenant_email).first()
    if existing_tenant:
        print(f"Tenant user already exists: {tenant_email}")
        return existing_tenant
    
    # Create tenant user
    tenant_user = User(
        id=str(uuid.uuid4()),
        email=tenant_email,
        name="Jane Tenant",
        password=get_password_hash("tenant123"),
        role=UserRole.TENANT,
        phone="+1234567892",
        address="456 Tenant Avenue, City, State",
        is_active=True,
        email_verified=True
    )
    
    db.add(tenant_user)
    db.commit()
    db.refresh(tenant_user)
    
    # Create tenant profile
    tenant_profile = TenantProfile(
        id=str(uuid.uuid4()),
        user_id=tenant_user.id,
        age=25,
        occupation="Software Engineer",
        monthly_income=5000.0,
        emergency_contact="+1234567890",
        preferences="Non-smoker, vegetarian"
    )
    
    db.add(tenant_profile)
    
    print(f"Tenant user created: {tenant_email}")
    print(f"Password: tenant123")
    return tenant_user

def create_sample_properties(db: Session, owner_user: User):
    """Create sample properties."""
    properties_data = [
        {
            "title": "Cozy PG Near Tech Park",
            "description": "A comfortable paying guest accommodation near the tech park with all modern amenities.",
            "address": "123 Tech Park Road, Electronic City",
            "city": "Bangalore",
            "state": "Karnataka",
            "zip_code": "560100",
            "latitude": 12.9141,
            "longitude": 77.6101,
            "price_per_month": 12000.0,
            "security_deposit": 24000.0,
            "total_rooms": 10,
            "available_rooms": 8,
            "amenities": '["WiFi", "AC", "Laundry", "Parking", "24/7 Security", "Mess"]',
            "rules": "No smoking, No alcohol, No late night parties"
        },
        {
            "title": "Premium PG for Professionals",
            "description": "High-end paying guest facility designed for working professionals.",
            "address": "456 Business District, Koramangala",
            "city": "Bangalore",
            "state": "Karnataka", 
            "zip_code": "560034",
            "latitude": 12.9352,
            "longitude": 77.6245,
            "price_per_month": 18000.0,
            "security_deposit": 36000.0,
            "total_rooms": 15,
            "available_rooms": 12,
            "amenities": '["WiFi", "AC", "Gym", "Swimming Pool", "Laundry", "Housekeeping", "Parking"]',
            "rules": "Professionals only, No guests after 10 PM"
        }
    ]
    
    for prop_data in properties_data:
        existing_property = db.query(Property).filter(
            Property.title == prop_data["title"]
        ).first()
        
        if not existing_property:
            property_obj = Property(
                id=str(uuid.uuid4()),
                owner_id=owner_user.id,
                **prop_data
            )
            db.add(property_obj)
            print(f"Created property: {prop_data['title']}")
    
    db.commit()

def seed_database():
    """Seed the database with initial data."""
    print("Starting database seeding...")
    
    db = SessionLocal()
    try:
        # Create sample users
        admin_user = create_admin_user(db)
        owner_user = create_sample_owner(db)
        tenant_user = create_sample_tenant(db)
        
        # Create sample properties
        create_sample_properties(db, owner_user)
        
        db.commit()
        print("Database seeding completed successfully!")
        
        print("\n" + "="*50)
        print("Sample Users Created:")
        print("="*50)
        print(f"Admin: admin@pgapp.com / admin123")
        print(f"Owner: owner@pgapp.com / owner123")
        print(f"Tenant: tenant@pgapp.com / tenant123")
        print("="*50)
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

def main():
    """Main function."""
    print("PG Application Database Setup")
    print("=" * 40)
    
    # Create tables
    create_tables()
    
    # Seed database
    seed_database()
    
    print("\nDatabase setup completed!")

if __name__ == "__main__":
    main()
