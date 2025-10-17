from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.sql import func  # Import func directly
from typing import List

from app.database import get_db
from app.models import intake_models, user_models
from app.models.schemas import GoalsCreate, GoalsUpdate, GoalsResponse

router = APIRouter(
    prefix="/goals",
    tags=["goals"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=GoalsResponse)
def create_goals(goals: GoalsCreate, email: str, db: Session = Depends(get_db)):
    """
    Create or update goals for a user
    """
    # First get the user to ensure we have the user_id
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check if the user has an intake form
    intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.user_id == user.user_id).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="Intake form not found")
    
    # Update goals
    intake_form.goal1 = goals.goal1
    intake_form.goal2 = goals.goal2
    intake_form.goal3 = goals.goal3
    intake_form.obstacle = goals.obstacle
    intake_form.goals_completed = True
    intake_form.last_updated = func.now()  # Use func.now() directly, not db.func.now()
    
    db.commit()
    db.refresh(intake_form)
    
    return intake_form

@router.get("/{email}", response_model=GoalsResponse)
def get_goals(email: str, db: Session = Depends(get_db)):
    """
    Get goals for a user by email
    """
    # First get the user to ensure we have the user_id
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.user_id == user.user_id).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="Intake form not found")
    
    return intake_form

@router.put("/{email}", response_model=GoalsResponse)
def update_goals(email: str, goals: GoalsUpdate, db: Session = Depends(get_db)):
    """
    Update goals for a user
    """
    # First get the user to ensure we have the user_id
    user = db.query(user_models.User).filter(user_models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    intake_form = db.query(intake_models.IntakeForm).filter(intake_models.IntakeForm.user_id == user.user_id).first()
    if not intake_form:
        raise HTTPException(status_code=404, detail="Intake form not found")
    
    # Update with provided values
    for key, value in goals.dict(exclude_unset=True).items():
        setattr(intake_form, key, value)
    
    intake_form.last_updated = func.now()  # Use func.now() directly, not db.func.now()
    
    db.commit()
    db.refresh(intake_form)
    
    return intake_form