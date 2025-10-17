# Create this file if it doesn't exist

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional

from app.database import get_db
from app.models import intake_models, user_models
from app.models.schemas import AddressResponse, AddressCreate  # Add AddressCreate here

router = APIRouter(
    prefix="/address",
    tags=["addresses"],
    responses={404: {"description": "Not found"}},
)

@router.get("/user/{email}", response_model=List[AddressResponse])
def get_user_address(email: str, db: Session = Depends(get_db)):
    """
    Get addresses for a user by email
    """
    try:
        # Find the user first
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Get addresses directly by user ID
        addresses = db.query(intake_models.Address).filter(
            intake_models.Address.user_id == user.user_id
        ).all()
        
        print(f"Found {len(addresses)} addresses for user {user.user_id}")
        for a in addresses:
            print(f"  - Address: {a.house_number} {a.street}, {a.city}, {a.country}")
        
        return addresses
    except Exception as e:
        print(f"Error getting address: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/user/{email}", response_model=AddressResponse)
def create_user_address(email: str, address_data: AddressCreate, db: Session = Depends(get_db)):
    """
    Create or update an address for a user
    """
    try:
        # Find the user first
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Find the intake form to get the form_id
        intake_form = db.query(intake_models.IntakeForm).filter(
            intake_models.IntakeForm.user_id == user.user_id
        ).first()
        
        # Find existing address
        existing_address = db.query(intake_models.Address).filter(
            intake_models.Address.user_id == user.user_id
        ).first()
        
        if existing_address:
            # Update existing address
            for key, value in address_data.dict().items():
                setattr(existing_address, key, value)
            address = existing_address
        else:
            # Create new address
            address = intake_models.Address(
                user_id=user.user_id,
                form_id=intake_form.form_id if intake_form else None,
                **address_data.dict()
            )
            db.add(address)
            
        db.commit()
        db.refresh(address)
        return address
    except Exception as e:
        db.rollback()
        print(f"Error creating/updating address: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")