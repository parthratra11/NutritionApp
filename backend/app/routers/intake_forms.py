from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func  # Import func directly
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import intake_models, user_models
from app.models.schemas import IntakeFormResponse, IntakeFormUpdate  # Add IntakeFormUpdate import

router = APIRouter(
    prefix="/intake",
    tags=["intake forms"],
    responses={404: {"description": "Not found"}},
)

@router.put("/{email}", response_model=IntakeFormResponse)
def update_intake_form(email: str, form_data: IntakeFormUpdate, db: Session = Depends(get_db)):
    """
    Update intake form with all fields
    """
    try:
        # Check if form exists
        intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.email == email).first()
        if not intake_form:
            raise HTTPException(status_code=404, detail="Intake form not found")
        
        # Update all form fields from the request data
        form_data_dict = form_data.dict(exclude_unset=True)
        
        # Handle nested objects separately
        nested_objects = ['strength_measurement', 'genetics_data', 'dumbbell_info', 
                         'gym_equipment', 'cardio_equipment', 'address', 'body_photos']
        
        # Update main form fields
        for key, value in form_data_dict.items():
            if key not in nested_objects and hasattr(intake_form, key):
                setattr(intake_form, key, value)
        
        # Update last_updated timestamp
        intake_form.last_updated = func.now()
        
        # Commit changes to database
        db.commit()
        db.refresh(intake_form)
        
        return intake_form
        
    except Exception as e:
        db.rollback()
        print(f"Error updating intake form: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/initialize/{email}")
def initialize_intake_form(email: str, db: Session = Depends(get_db)):
    """
    Initialize an empty intake form for a user
    """
    try:
        # Check if user exists
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if form already exists
        form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.email == email).first()
        if form:
            return {"message": "Intake form already exists"}
        
        # Create new form with correct func.now() usage
        new_form = intake_models.IntakeForm(
            user_id=user.user_id,
            email=email.lower(),
            last_updated=func.now(),  # Use func.now() directly, not db.func.now()
            # Set default values for all non-nullable fields
            goals_completed=False,
            weight_height_completed=False,
            occupation_completed=False,
            activity_level_completed=False,
            dedication_level_completed=False,
            stress_level_completed=False,
            caffeine_completed=False,
            intake_form_completed=False
        )
        
        db.add(new_form)
        db.commit()
        db.refresh(new_form)
        
        return {"message": "Intake form initialized successfully"}
    except IntegrityError as e:
        db.rollback()
        print(f"IntegrityError: {str(e)}")
        raise HTTPException(status_code=400, detail="Database integrity error. Form might already exist.")
    except Exception as e:
        db.rollback()
        print(f"Error initializing form: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/{email}", response_model=IntakeFormResponse)
def get_intake_form(email: str, db: Session = Depends(get_db)):
    """
    Get intake form data for a user
    """
    try:
        form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.email == email).first()
        if not form:
            raise HTTPException(status_code=404, detail="Intake form not found")
        
        return form
    except Exception as e:
        print(f"Error getting form: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")