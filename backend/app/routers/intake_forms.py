from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import json
from typing import List, Optional

from app.database import get_db
from app.models.intake_models import IntakeForm  # Changed import path from user_models to intake_models

router = APIRouter(prefix="/intake_forms", tags=["intake_forms"])

@router.get("/{user_id}")
async def get_intake_form(user_id: str, db: Session = Depends(get_db)):
    """Get intake form data by user_id"""
    form = db.query(IntakeForm).filter(IntakeForm.user_id == user_id).first()
    
    if not form:
        return {}
    
    # Parse string fields that store JSON
    result = {c.name: getattr(form, c.name) for c in form.__table__.columns}
    
    # Convert list or dict strings to actual objects
    for field in ["cardio_equipment", "gym_equipment", "body_photo_urls"]:
        if result.get(field) and isinstance(result[field], str):
            try:
                result[field] = json.loads(result[field])
            except:
                pass
    
    return result

@router.post("/")
async def create_or_update_intake_form(form_data: dict, db: Session = Depends(get_db)):
    """Create or update intake form data"""
    user_id = form_data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")
    
    # Check if form already exists for this user
    existing_form = db.query(IntakeForm).filter(IntakeForm.user_id == user_id).first()
    
    # Convert list or dict fields to JSON strings
    for field in ["cardio_equipment", "gym_equipment", "body_photo_urls", "dumbbell_info"]:
        if field in form_data and (isinstance(form_data[field], list) or isinstance(form_data[field], dict)):
            form_data[field] = json.dumps(form_data[field])
    
    if existing_form:
        # Update existing form
        for key, value in form_data.items():
            if key != "user_id" and key != "form_id" and hasattr(existing_form, key):
                setattr(existing_form, key, value)
        db.commit()
        db.refresh(existing_form)
        return {"message": "Form updated successfully"}
    else:
        # Create new form
        new_form = IntakeForm(**form_data)
        db.add(new_form)
        db.commit()
        db.refresh(new_form)
        return {"message": "Form created successfully"}

@router.put("/complete/{user_id}")
async def mark_form_as_complete(user_id: str, db: Session = Depends(get_db)):
    """Mark a form as complete"""
    form = db.query(IntakeForm).filter(IntakeForm.user_id == user_id).first()
    
    if not form:
        raise HTTPException(status_code=404, detail="Form not found")
    
    form.intake_form_completed = True
    db.commit()
    
    return {"message": "Form marked as complete"}