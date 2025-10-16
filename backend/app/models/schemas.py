from pydantic import BaseModel
from typing import List, Optional, ForwardRef
from datetime import datetime

# Use ForwardRefs to avoid circular imports
StrengthMeasurementResponseRef = ForwardRef('StrengthMeasurementResponse')
GeneticsResponseRef = ForwardRef('GeneticsResponse')
DumbbellInfoResponseRef = ForwardRef('DumbbellInfoResponse')
AddressResponseRef = ForwardRef('AddressResponse')
GymEquipmentResponseRef = ForwardRef('GymEquipmentResponse')
CardioEquipmentResponseRef = ForwardRef('CardioEquipmentResponse')
BodyPhotoResponseRef = ForwardRef('BodyPhotoResponse')

# User schemas
class UserBase(BaseModel):
    email: str  # Changed from EmailStr to str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    user_id: str
    
class UserResponse(UserBase):
    user_id: str
    created_at: datetime
    is_signup_only: bool = True
    
    class Config:
        orm_mode = True
        from_attributes = True

# Address schemas
class AddressBase(BaseModel):
    house_number: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None

class AddressCreate(AddressBase):
    pass

class AddressResponse(AddressBase):
    address_id: int
    user_id: str
    address_updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

# Goals schemas
class GoalsBase(BaseModel):
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    
class GoalsCreate(GoalsBase):
    pass

class GoalsUpdate(GoalsBase):
    goals_completed: bool = True

class GoalsResponse(GoalsBase):
    goals_completed: bool
    
    class Config:
        orm_mode = True
        from_attributes = True

# Add these schemas above the IntakeFormResponse class

# Strength Measurement schemas
class StrengthMeasurementBase(BaseModel):
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

class StrengthMeasurementCreate(StrengthMeasurementBase):
    pass

class StrengthMeasurementResponse(StrengthMeasurementBase):
    measurement_id: int
    form_id: int
    user_id: str
    strength1_completed: bool = False
    strength2_completed: bool = False
    last_updated: Optional[datetime] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

# Genetics schemas
class GeneticsBase(BaseModel):
    wrist_circumference: Optional[str] = None
    ankle_circumference: Optional[str] = None
    body_fat: Optional[str] = None

class GeneticsCreate(GeneticsBase):
    pass

class GeneticsResponse(GeneticsBase):
    genetics_id: int
    form_id: int
    user_id: str
    genetics_completed: bool = False
    
    class Config:
        orm_mode = True
        from_attributes = True

# Dumbbell Info schemas
class DumbbellInfoBase(BaseModel):
    is_full_set: Optional[bool] = None
    min_weight: Optional[str] = None
    max_weight: Optional[str] = None

class DumbbellInfoCreate(DumbbellInfoBase):
    pass

class DumbbellInfoResponse(DumbbellInfoBase):
    dumbbell_id: int
    form_id: int
    user_id: str
    
    class Config:
        orm_mode = True
        from_attributes = True

# Gym Equipment schemas
class GymEquipmentBase(BaseModel):
    equipment_type: str

class GymEquipmentCreate(GymEquipmentBase):
    pass

class GymEquipmentResponse(GymEquipmentBase):
    equipment_id: int
    form_id: int
    user_id: str
    
    class Config:
        orm_mode = True
        from_attributes = True

# Cardio Equipment schemas
class CardioEquipmentBase(BaseModel):
    equipment_type: str

class CardioEquipmentCreate(CardioEquipmentBase):
    pass

class CardioEquipmentResponse(CardioEquipmentBase):
    equipment_id: int
    form_id: int
    user_id: str
    
    class Config:
        orm_mode = True
        from_attributes = True

# Body Photo schemas
class BodyPhotoBase(BaseModel):
    photo_url: str

class BodyPhotoCreate(BodyPhotoBase):
    pass

class BodyPhotoResponse(BodyPhotoBase):
    photo_id: int
    form_id: int
    user_id: str
    upload_date: datetime
    
    class Config:
        orm_mode = True
        from_attributes = True

# Complete intake form response
class IntakeFormResponse(BaseModel):
    # Basic user info
    email: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_signup_only: bool = True
    
    # Goals section
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    goals_completed: bool = False
    
    # Physical attributes
    age: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    measurement_system: Optional[str] = None
    weight_height_completed: bool = False
    
    # Activity and lifestyle
    activity_level: Optional[str] = None
    activity_level_completed: bool = False
    dedication_level: Optional[str] = None
    dedication_level_completed: bool = False
    stress_level: Optional[str] = None
    stress_level_completed: bool = False
    caffeine: Optional[str] = None
    caffeine_completed: bool = False
    
    # Diet and health
    diet: Optional[str] = None
    diet_description: Optional[str] = None
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
    
    # Other fields
    occupation: Optional[str] = None
    occupation_completed: bool = False
    
    # Meta fields
    intake_form_completed: bool = False
    last_updated: Optional[datetime] = None
    
    # Include nested objects
    strength_measurement: Optional[StrengthMeasurementResponseRef] = None
    genetics_data: Optional[GeneticsResponseRef] = None
    dumbbell_info: Optional[DumbbellInfoResponseRef] = None
    address: Optional[AddressResponseRef] = None
    gym_equipment: List[GymEquipmentResponseRef] = []
    cardio_equipment: List[CardioEquipmentResponseRef] = []
    body_photos: List[BodyPhotoResponseRef] = []
    
    class Config:
        orm_mode = True
        from_attributes = True

class IntakeFormUpdate(BaseModel):
    # Basic user info
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    is_signup_only: Optional[bool] = None
    
    # Goals section
    goal1: Optional[str] = None
    goal2: Optional[str] = None
    goal3: Optional[str] = None
    obstacle: Optional[str] = None
    goals_completed: Optional[bool] = None
    
    # Physical attributes
    age: Optional[str] = None
    weight: Optional[str] = None
    height: Optional[str] = None
    measurement_system: Optional[str] = None
    weight_height_completed: Optional[bool] = None
    
    # Activity and lifestyle
    activity_level: Optional[str] = None
    activity_level_completed: Optional[bool] = None
    dedication_level: Optional[str] = None
    dedication_level_completed: Optional[bool] = None
    stress_level: Optional[str] = None
    stress_level_completed: Optional[bool] = None
    caffeine: Optional[str] = None
    caffeine_completed: Optional[bool] = None
    
    # Diet and health
    diet: Optional[str] = None
    diet_description: Optional[str] = None
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
    
    # Occupation
    occupation: Optional[str] = None
    occupation_completed: Optional[bool] = None
    
    # Meta fields
    intake_form_completed: Optional[bool] = None
    
    class Config:
        orm_mode = True
        from_attributes = True

IntakeFormResponse.update_forward_refs()