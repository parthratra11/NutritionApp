from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.sql import func
from typing import List, Optional
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.models import intake_models, user_models
from app.models.schemas import IntakeFormResponse, IntakeFormUpdate, StrengthMeasurementsCreate, StrengthMeasurementsResponse

router = APIRouter(
    prefix="/intake",
    tags=["intake forms"],
    responses={404: {"description": "Not found"}},
)

@router.put("/{email}", response_model=IntakeFormResponse)
def update_intake_form(email: str, form_data: IntakeFormUpdate, db: Session = Depends(get_db)):
    """
    Update an intake form
    """
    try:
        # Find the user
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Find the intake form
        intake_form = db.query(intake_models.IntakeForm).filter(
            intake_models.IntakeForm.user_id == user.user_id
        ).first()
        
        if not intake_form:
            # Create new intake form if it doesn't exist
            intake_form = intake_models.IntakeForm(
                user_id=user.user_id,
                email=email.lower()
            )
            db.add(intake_form)
            
        # Debug: Print the form_data
        print(f"Received form data: {form_data.dict()}")
        
        # Special handling for body_fat to debug
        if hasattr(form_data, 'body_fat') and form_data.body_fat is not None:
            print(f"Setting body_fat directly = {form_data.body_fat}")
            intake_form.body_fat = form_data.body_fat
            
        # Update the intake form with form_data
        for key, value in form_data.dict(exclude_unset=True).items():
            if key != 'body_fat' and hasattr(intake_form, key):  # Skip body_fat since we already set it
                print(f"Setting {key} = {value}")
                setattr(intake_form, key, value)
        
        db.commit()
        db.refresh(intake_form)
        
        # Debug: Print the intake form after update
        print(f"After update: body_fat = {intake_form.body_fat}")
        
        return intake_form
    except Exception as e:
        db.rollback()
        print(f"Error updating intake form: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{email}/strength-measurements", response_model=StrengthMeasurementsResponse)
def save_strength_measurements(email: str, strength_data: StrengthMeasurementsCreate, db: Session = Depends(get_db)):
    """
    Save strength measurements for a user
    """
    try:
        # Find the user
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Find the intake form
        intake_form = db.query(intake_models.IntakeForm).filter(
            intake_models.IntakeForm.user_id == user.user_id
        ).first()
        
        if not intake_form:
            raise HTTPException(status_code=404, detail="Intake form not found")
            
        # Check if strength measurements already exist
        existing_measurements = db.query(intake_models.StrengthMeasurement).filter(
            intake_models.StrengthMeasurement.user_id == user.user_id
        ).first()
        
        if existing_measurements:
            # Update existing measurements
            print("Updating existing strength measurements")
            for key, value in strength_data.dict().items():
                if hasattr(existing_measurements, key):
                    setattr(existing_measurements, key, value)
            
            existing_measurements.last_updated = func.now()
            measurement = existing_measurements
        else:
            # Create new strength measurements
            print("Creating new strength measurements")
            measurement = intake_models.StrengthMeasurement(
                user_id=user.user_id,
                form_id=intake_form.form_id,
                **strength_data.dict(),
                last_updated=func.now()
            )
            db.add(measurement)
        
        # Update strength2_completed in the intake form if needed
        if strength_data.strength2_completed:
            intake_form.strength2_completed = True
            intake_form.last_updated = func.now()
        
        db.commit()
        db.refresh(measurement)
        
        return measurement
    except Exception as e:
        db.rollback()
        print(f"Error saving strength measurements: {str(e)}")
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
        form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.user_id == user.user_id).first()
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
    Get an intake form by user email
    """
    try:
        # Find the user by email
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Find the intake form and eagerly load relationships
        intake_form = db.query(intake_models.IntakeForm).options(
            selectinload(intake_models.IntakeForm.cardio_equipment),
            selectinload(intake_models.IntakeForm.gym_equipment),
            selectinload(intake_models.IntakeForm.dumbbell_info),
            selectinload(intake_models.IntakeForm.genetics),
            selectinload(intake_models.IntakeForm.strength_measurements),
            selectinload(intake_models.IntakeForm.address),
            selectinload(intake_models.IntakeForm.body_photos),
        ).filter(
            intake_models.IntakeForm.user_id == user.user_id
        ).first()
        
        if not intake_form:
            raise HTTPException(status_code=404, detail="Intake form not found")
        
        # Debug: Check cardio equipment
        cardio_count = len(intake_form.cardio_equipment) if intake_form.cardio_equipment else 0
        print(f"Found {cardio_count} cardio equipment items for user {user.user_id}")
        for eq in (intake_form.cardio_equipment or []):
            print(f"  - {eq.equipment_type}")
        
        return intake_form
    except Exception as e:
        print(f"Error getting form: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/{email}/cardio-equipment")
def save_user_cardio_equipment(email: str, equipment_data: dict, db: Session = Depends(get_db)):
    """
    Save user's cardio equipment selections
    """
    try:
        # Find the user
        user = db.query(user_models.User).filter(user_models.User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        # Find the intake form
        intake_form = db.query(intake_models.IntakeForm).filter(
            intake_models.IntakeForm.user_id == user.user_id
        ).first()
        
        if not intake_form:
            raise HTTPException(status_code=404, detail="Intake form not found")

        # Get equipment list from request data
        equipment_list = equipment_data.get("equipment_list", [])
        print(f"Saving cardio equipment for user {user.user_id}: {equipment_list}")
        # Delete existing cardio equipment for this user
        db.query(intake_models.CardioEquipment).filter(
            intake_models.CardioEquipment.user_id == user.user_id
        ).delete(synchronize_session=False)
        
        # Add new cardio equipment entries
        for equipment_type in equipment_list:
            if equipment_type:  # Only add non-empty equipment types
                cardio_eq = intake_models.CardioEquipment(
                    form_id=intake_form.form_id,
                    user_id=user.user_id,
                    equipment_type=equipment_type
                )
                db.add(cardio_eq)
                print(f"Adding cardio equipment: {equipment_type}")
                
        db.commit()
        
        return {"message": f"Successfully saved {len(equipment_list)} cardio equipment items"}
    except Exception as e:
        db.rollback()
        print(f"Error saving cardio equipment: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

