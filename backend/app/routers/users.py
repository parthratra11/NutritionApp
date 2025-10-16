from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import user_models, schemas

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
    # Check if user exists
    db_user = db.query(user_models.User).filter(user_models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
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
    
    return db_user

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
    # Check if user exists
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if address exists
    db_address = db.query(user_models.UserAddress).filter(user_models.UserAddress.user_id == user.user_id).first()
    
    if db_address:
        # Update existing address
        for key, value in address.dict().items():
            setattr(db_address, key, value)
        db_address.address_updated_at = db.func.now()
    else:
        # Create new address
        db_address = user_models.UserAddress(
            user_id=user.user_id,
            **address.dict(),
            address_updated_at=db.func.now()
        )
        db.add(db_address)
    
    db.commit()
    db.refresh(db_address)
    
    return db_address