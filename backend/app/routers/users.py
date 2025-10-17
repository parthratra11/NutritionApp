from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List

from app.database import get_db
from app.models import user_models, schemas, intake_models

router = APIRouter(
    prefix="/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user
    """
    # Print for debugging
    print(f"Creating user with data: {user}")
    
    # Check if user exists
    db_user = db.query(user_models.User).filter(user_models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Create new user
        db_user = user_models.User(
            user_id=user.user_id,
            email=user.email,
            full_name=user.full_name,
            phone_number=user.phone_number
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"User created successfully: {db_user.user_id}")
        
        return db_user
    except Exception as e:
        db.rollback()
        print(f"Error creating user: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{email}", response_model=schemas.UserResponse)
def get_user(email: str, db: Session = Depends(get_db)):
    """
    Get user by email
    """
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.post("/{email}/address", response_model=schemas.AddressResponse)
def create_user_address(email: str, address: schemas.AddressCreate, db: Session = Depends(get_db)):
    """
    Create or update address for a user
    """
    # Print debugging info
    print(f"Creating address for email: {email}")
    print(f"Address data: {address}")
    
    # Check if user exists
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user:
        print(f"User not found with email: {email}")
        raise HTTPException(status_code=404, detail="User not found")
    
    print(f"Found user with ID: {user.user_id}")
    
    # Check if address exists in addresses table
    db_address = db.query(intake_models.Address).filter(intake_models.Address.user_id == user.user_id).first()
    
    try:
        if db_address:
            print("Updating existing address in addresses table")
            # Update existing address
            for key, value in address.dict().items():
                if hasattr(db_address, key):
                    setattr(db_address, key, value)
            db_address.address_updated_at = func.now()
        else:
            print("Creating new address in addresses table")
            # Create new address with just user_id
            db_address = intake_models.Address(
                user_id=user.user_id,
                house_number=address.house_number,
                street=address.street,
                postal_code=address.postal_code,
                city=address.city,
                country=address.country
            )
            db.add(db_address)
        
        # Also update/create in user_addresses table for backward compatibility
        user_address = db.query(user_models.UserAddress).filter(user_models.UserAddress.user_id == user.user_id).first()
        if user_address:
            for key, value in address.dict().items():
                if hasattr(user_address, key):
                    setattr(user_address, key, value)
            user_address.address_updated_at = func.now()
        else:
            user_address = user_models.UserAddress(
                user_id=user.user_id,
                house_number=address.house_number,
                street=address.street,
                postal_code=address.postal_code,
                city=address.city,
                country=address.country
            )
            db.add(user_address)
        
        db.commit()
        db.refresh(db_address)
        print("Address saved successfully")
        
        return db_address
    except Exception as e:
        db.rollback()
        print(f"Error saving address: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")