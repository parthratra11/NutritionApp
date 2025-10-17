from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, TIMESTAMP, Float, Text, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database import Base

class IntakeForm(Base):
    __tablename__ = "intake_forms"
    
    form_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), unique=True)
    email = Column(String(255), unique=True)
    
    # Basic user data
    full_name = Column(String(255))
    phone_number = Column(String(20))
    is_signup_only = Column(Boolean, default=True)
    
    # Age/Weight/Height section
    age = Column(String(10))
    weight = Column(String(10))
    height = Column(String(10))
    body_fat = Column(String(20))  # Added body_fat column
    measurement_system = Column(Enum('metric', 'imperial', name='measurement_system'))
    weight_height_completed = Column(Boolean, default=False)
    
    # Goals section
    goal1 = Column(String(255))
    goal2 = Column(String(255))
    goal3 = Column(String(255))
    obstacle = Column(Text)
    goals_completed = Column(Boolean, default=False)
    
    # Occupation section
    occupation = Column(String(255))
    occupation_completed = Column(Boolean, default=False)
    
    # Activity level section
    activity_level = Column(Enum('sedentary', 'lightly_active', 'moderately_active', 
                             'very_active', 'extremely_active', 'active', name='activity_level'))
    activity_level_completed = Column(Boolean, default=False)
    
    # Dedication level section
    dedication_level = Column(Enum('minimum', 'moderate', 'maximum', name='dedication_level'))
    dedication_level_completed = Column(Boolean, default=False)
    
    # Stress level section
    stress_level = Column(Enum('low_stress', 'average_stress', 'high_stress', name='stress_level'))
    stress_level_completed = Column(Boolean, default=False)
    
    # Caffeine section
    caffeine = Column(String(255))
    caffeine_completed = Column(Boolean, default=False)
    
    # Diet information
    diet = Column(String(255))
    diet_description = Column(Text)
    
    # Medical information
    medical_conditions = Column(String(255))
    menstrual_info = Column(String(255))
    
    # Training preferences
    training_program = Column(String(255))
    weekly_frequency = Column(String(10))
    training_frequency_completed = Column(Boolean, default=False)
    training_time_preference = Column(String(50))
    training_time_completed = Column(Boolean, default=False)
    
    # Supplements
    supplements = Column(String(255))
    supplements_completed = Column(Boolean, default=False)
    
    # Equipment information
    additional_equipment_info = Column(Text)
    leg_curl_type = Column(String(50))
    has_measuring_tape = Column(Boolean, default=False)
    skinfold_calipers = Column(String(255))
    fitness_tech = Column(String(255))
    
    # Strength training
    strength_training_experience = Column(String(10))
    strength_competency = Column(String(50))
    strength_competency_value = Column(Float)
    strength_competency_comments = Column(Text)
    strength_choice_completed = Column(Boolean, default=False)
    
    # Other exercises
    other_exercises = Column(Text)
    other_exercise_completed = Column(Boolean, default=False)
    
    # Equipment completion flags
    equipment1_completed = Column(Boolean, default=False)
    equipment2_completed = Column(Boolean, default=False)
    equipment3_completed = Column(Boolean, default=False)
    equipment4_completed = Column(Boolean, default=False)
    
    # Program status
    current_program_completed = Column(Boolean, default=False)
    
    # Meta fields
    intake_form_completed = Column(Boolean, default=False)
    last_updated = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships - match the names with schemas.py
    user = relationship("User", back_populates="intake_form")
    strength_measurements = relationship("StrengthMeasurement", back_populates="intake_form")
    genetics = relationship("Genetics", back_populates="intake_form")
    dumbbell_info = relationship("DumbbellInfo", back_populates="intake_form")
    gym_equipment = relationship("GymEquipment", back_populates="intake_form")
    cardio_equipment = relationship("CardioEquipment", back_populates="intake_form")
    address = relationship("Address", back_populates="intake_form")
    body_photos = relationship("BodyPhoto", back_populates="intake_form")


class StrengthMeasurement(Base):
    __tablename__ = "strength_measurements"
    
    measurement_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Measurements
    squat_weight = Column(String(20))
    squat_reps = Column(String(10))
    bench_press_weight = Column(String(20))
    bench_press_reps = Column(String(10))
    deadlift_weight = Column(String(20))
    deadlift_reps = Column(String(10))
    overhead_press_weight = Column(String(20))
    overhead_press_reps = Column(String(10))
    chin_up_weight = Column(String(20))
    chin_up_reps = Column(String(10))
    
    # Completion status
    strength1_completed = Column(Boolean, default=False)
    strength2_completed = Column(Boolean, default=False)
    
    # Timestamp
    last_updated = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="strength_measurements")


class Genetics(Base):
    __tablename__ = "genetics"
    
    genetics_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Genetics measurements (body_fat moved to intake_forms)
    wrist_circumference = Column(String(20))
    ankle_circumference = Column(String(20))
    # body_fat removed from here
    
    # Completion status
    genetics_completed = Column(Boolean, default=False)
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="genetics")


class DumbbellInfo(Base):
    __tablename__ = "dumbbell_info"
    
    dumbbell_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Dumbbell data
    is_full_set = Column(Boolean)
    min_weight = Column(String(20))
    max_weight = Column(String(20))
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="dumbbell_info")


class GymEquipment(Base):
    __tablename__ = "gym_equipment"
    
    equipment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Equipment type
    equipment_type = Column(String(255))
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="gym_equipment")


class CardioEquipment(Base):
    __tablename__ = "cardio_equipment"
    
    equipment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Equipment type
    equipment_type = Column(String(255))
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="cardio_equipment")


class Address(Base):
    __tablename__ = "addresses"
    
    address_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Address details
    house_number = Column(String(100))
    street = Column(String(255))
    city = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(100))
    
    # Last updated
    address_updated_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="address")


class BodyPhoto(Base):
    __tablename__ = "body_photos"
    
    photo_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    form_id = Column(Integer, ForeignKey("intake_forms.form_id"), nullable=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), nullable=False)
    
    # Photo URL
    photo_url = Column(String(255))
    upload_date = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    intake_form = relationship("IntakeForm", back_populates="body_photos")