from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import intake_models, schemas

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.GoalsResponse)
def create_goals(goals: schemas.GoalsCreate, email: str, db: Session = Depends(get_db)):
    """
    Create or update goals for a user
    """
    # Check if the user exists
    intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.email == email).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update goals
    intake_form.goal1 = goals.goal1
    intake_form.goal2 = goals.goal2
    intake_form.goal3 = goals.goal3
    intake_form.obstacle = goals.obstacle
    intake_form.goals_completed = True
    intake_form.last_updated = db.func.now()
    
    db.commit()
    db.refresh(intake_form)
    
    return intake_form

@router.get("/{email}", response_model=schemas.GoalsResponse)
def get_goals(email: str, db: Session = Depends(get_db)):
    """
    Get goals for a user by email
    """
    intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.email == email).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="User not found")
    
    return intake_form

@router.put("/{email}", response_model=schemas.GoalsResponse)
def update_goals(email: str, goals: schemas.GoalsUpdate, db: Session = Depends(get_db)):
    """
    Update goals for a user
    """
    intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.email == email).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update with provided values
    for key, value in goals.dict(exclude_unset=True).items():
        setattr(intake_form, key, value)
    
    intake_form.last_updated = db.func.now()
    
    db.commit()
    db.refresh(intake_form)
    
    return intake_form