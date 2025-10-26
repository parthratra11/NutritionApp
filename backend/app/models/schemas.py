from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
from datetime import datetime

# Define enums
class MeasurementSystem(str, Enum):
    metric = "metric"
    imperial = "imperial"

class ActivityLevel(str, Enum):
    sedentary = "sedentary"
    lightly_active = "lightly_active"
    moderately_active = "moderately_active"
    very_active = "very_active"
    extremely_active = "extremely_active"
    active = "active"

class DedicationLevel(str, Enum):
    minimum = "minimum"
    moderate = "moderate"
    maximum = "maximum"

class StressLevel(str, Enum):
    low_stress = "low_stress"
    average_stress = "average_stress"
    high_stress = "high_stress"

# User schemas
class UserBase(BaseModel):
    email: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_signup_only: bool = True

class UserCreate(UserBase):
    user_id: str

class UserResponse(UserBase):
    user_id: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Address schemas
class AddressCreate(BaseModel):
    house_number: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

class AddressResponse(BaseModel):
    address_id: int
    form_id: Optional[int] = None
    user_id: str
    house_number: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    address_updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Genetics schemas
class GeneticsUpdate(BaseModel):
    wrist_circumference: Optional[str] = None
    ankle_circumference: Optional[str] = None
    genetics_completed: Optional[bool] = None

class GeneticsResponse(BaseModel):
    genetics_id: int
    form_id: Optional[int] = None
    user_id: str
    wrist_circumference: Optional[str] = None
    ankle_circumference: Optional[str] = None
    genetics_completed: bool = False

    class Config:
        from_attributes = True

# Dumbbell info schemas
class DumbbellInfoCreate(BaseModel):
    is_full_set: bool
    min_weight: Optional[str] = None
    max_weight: Optional[str] = None

class DumbbellInfoResponse(BaseModel):
    dumbbell_id: int
    form_id: Optional[int] = None
    user_id: str
    is_full_set: Optional[bool] = None
    min_weight: Optional[str] = None
    max_weight: Optional[str] = None
    specific_weights: Optional[str]  # <-- Add this line

    class Config:
        from_attributes = True

# Equipment schemas
class GymEquipmentCreate(BaseModel):
    equipment_type: str

class GymEquipmentResponse(BaseModel):
    equipment_id: int
    form_id: Optional[int] = None
    user_id: str
    equipment_type: Optional[str] = None

    class Config:
        from_attributes = True

class CardioEquipmentCreate(BaseModel):
    equipment_type: str

class CardioEquipmentResponse(BaseModel):
    equipment_id: int
    form_id: Optional[int] = None
    user_id: str
    equipment_type: Optional[str] = None

    class Config:
        from_attributes = True

# Body photos schemas
class BodyPhotoCreate(BaseModel):
    photo_url: str

class BodyPhotoResponse(BaseModel):
    photo_id: int
    form_id: Optional[int] = None
    user_id: str
    photo_url: str
    upload_date: Optional[datetime] = None

    class Config:
        from_attributes = True

# Strength measurements schemas
class StrengthMeasurementsCreate(BaseModel):
    squat_weight: Optional[str] = None
    squat_reps: Optional[str] = None
    bench_press_weight: Optional[str] = None
    bench_press_reps: Optional[str] = None
    deadlift_weight: Optional[str] = None
    deadlift_reps: Optional[str] = None
    overhead_press_weight: Optional[str] = None
    overhead_press_reps: Optional[str] = None
    chin_up_weight: Optional[str] = None
    chin_up_reps: Optional[str] = None
    strength1_completed: Optional[bool] = None
    strength2_completed: Optional[bool] = None

class StrengthMeasurementsResponse(BaseModel):
    measurement_id: int
    form_id: Optional[int] = None
    user_id: str
    squat_weight: Optional[str] = None
    squat_reps: Optional[str] = None
    bench_press_weight: Optional[str] = None
    bench_press_reps: Optional[str] = None
    deadlift_weight: Optional[str] = None
    deadlift_reps: Optional[str] = None
    overhead_press_weight: Optional[str] = None
    overhead_press_reps: Optional[str] = None
    chin_up_weight: Optional[str] = None
    chin_up_reps: Optional[str] = None
    strength1_completed: bool = False
    strength2_completed: bool = False
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True

# Intake form schemas
class IntakeFormBase(BaseModel):
    email: str
    
    # Basic user data
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_signup_only: bool = True

class IntakeFormCreate(IntakeFormBase):
    user_id: str

class IntakeFormUpdate(BaseModel):
    # Basic user data
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_signup_only: Optional[bool] = None
    
    # Age/Weight/Height section
    age: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    body_fat: Optional[str] = None  # Added body_fat field
    measurement_system: Optional[MeasurementSystem] = None
    weight_height_completed: Optional[bool] = None
    
    # Goals section
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    goals_completed: Optional[bool] = None
    
    # Occupation section
    occupation: Optional[str] = None
    occupation_completed: Optional[bool] = None
    
    # Activity level section
    activity_level: Optional[ActivityLevel] = None
    activity_level_completed: Optional[bool] = None
    
    # Dedication level section
    dedication_level: Optional[DedicationLevel] = None
    dedication_level_completed: Optional[bool] = None
    
    # Stress level section
    stress_level: Optional[StressLevel] = None
    stress_level_completed: Optional[bool] = None
    
    # Caffeine section
    caffeine: Optional[str] = None
    caffeine_completed: Optional[bool] = None
    
    # Diet information
    diet: Optional[str] = None
    diet_description: Optional[str] = None
    
    # Medical information
    medical_conditions: Optional[str] = None
    menstrual_info: Optional[str] = None
    
    # Training preferences
    training_program: Optional[str] = None
    weekly_frequency: Optional[str] = None
    training_frequency_completed: Optional[bool] = None
    training_time_preference: Optional[str] = None
    training_time_completed: Optional[bool] = None
    
    # Supplements
    supplements: Optional[str] = None
    supplements_completed: Optional[bool] = None
    
    # Equipment information
    additional_equipment_info: Optional[str] = None
    leg_curl_type: Optional[str] = None
    has_measuring_tape: Optional[bool] = None
    skinfold_calipers: Optional[str] = None
    fitness_tech: Optional[str] = None
    
    # Strength training
    strength_training_experience: Optional[str] = None
    strength_competency: Optional[str] = None
    strength_competency_value: Optional[float] = None
    strength_competency_comments: Optional[str] = None
    strength_choice_completed: Optional[bool] = None
    
    # Other exercises
    other_exercises: Optional[str] = None
    other_exercise_completed: Optional[bool] = None
    
    # Equipment completion flags
    equipment1_completed: Optional[bool] = None
    equipment2_completed: Optional[bool] = None
    equipment3_completed: Optional[bool] = None
    equipment4_completed: Optional[bool] = None
    
    # Program status
    current_program_completed: Optional[bool] = None
    intake_form_completed: Optional[bool] = None
    
    # Meta fields
    last_updated: Optional[datetime] = None
    sleep_quality: Optional[str] = None  # <-- Add this line

class IntakeFormResponse(BaseModel):
    form_id: int
    user_id: str
    email: str
    
    # Basic user data
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_signup_only: bool = True
    
    # Age/Weight/Height section
    age: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    body_fat: Optional[str] = None  # Added body_fat field
    measurement_system: Optional[str] = None
    weight_height_completed: bool = False
    
    # Goals section
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    goals_completed: bool = False
    
    # Occupation section
    occupation: Optional[str] = None
    occupation_completed: bool = False
    
    # Activity level section
    activity_level: Optional[str] = None
    activity_level_completed: bool = False
    
    # Dedication level section
    dedication_level: Optional[str] = None
    dedication_level_completed: bool = False
    
    # Stress level section
    stress_level: Optional[str] = None
    stress_level_completed: bool = False
    
    # Caffeine section
    caffeine: Optional[str] = None
    caffeine_completed: bool = False
    
    # Diet information
    diet: Optional[str] = None
    diet_description: Optional[str] = None
    
    # Medical information
    medical_conditions: Optional[str] = None
    menstrual_info: Optional[str] = None
    
    # Training preferences
    training_program: Optional[str] = None
    weekly_frequency: Optional[str] = None
    training_frequency_completed: bool = False
    training_time_preference: Optional[str] = None
    training_time_completed: bool = False
    
    # Supplements
    supplements: Optional[str] = None
    supplements_completed: bool = False
    
    # Equipment information
    additional_equipment_info: Optional[str] = None
    leg_curl_type: Optional[str] = None
    has_measuring_tape: bool = False
    skinfold_calipers: Optional[str] = None
    fitness_tech: Optional[str] = None
    
    # Strength training
    strength_training_experience: Optional[str] = None
    strength_competency: Optional[str] = None
    strength_competency_value: Optional[float] = None
    strength_competency_comments: Optional[str] = None
    strength_choice_completed: bool = False
    
    # Other exercises
    other_exercises: Optional[str] = None
    other_exercise_completed: bool = False
    
    # Equipment completion flags
    equipment1_completed: bool = False
    equipment2_completed: bool = False
    equipment3_completed: bool = False
    equipment4_completed: bool = False
    
    # Program status
    current_program_completed: bool = False
    
    # Meta fields
    intake_form_completed: bool = False
    last_updated: Optional[datetime] = None
    sleep_quality: Optional[str] = None  # <-- Add this line
    
    # Related data
    strength_measurements: List[StrengthMeasurementsResponse] = []
    genetics: List[GeneticsResponse] = []
    dumbbell_info: List[DumbbellInfoResponse] = []
    gym_equipment: List[GymEquipmentResponse] = []
    cardio_equipment: List[CardioEquipmentResponse] = []
    address: List[AddressResponse] = []
    body_photos: List[BodyPhotoResponse] = []

    class Config:
        from_attributes = True

# Goals schemas
class GoalCreate(BaseModel):
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None

class GoalsCreate(GoalCreate):
    pass  # For compatibility with old code

class GoalUpdate(BaseModel):
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    goals_completed: Optional[bool] = None

class GoalsUpdate(GoalUpdate):
    pass  # For compatibility with old code

class GoalResponse(BaseModel):
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    goals_completed: bool = False
    form_id: int

    class Config:
        from_attributes = True

class GoalsResponse(GoalResponse):
    pass  # For compatibility with old code

# Update forward references
StrengthMeasurementsResponse.update_forward_refs()
IntakeFormResponse.update_forward_refs()