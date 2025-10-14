from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, TIMESTAMP, Float, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(255), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True)
    full_name = Column(String(255))
    phone_number = Column(String(20))
    hashed_password = Column(String(255))
    created_at = Column(TIMESTAMP, server_default=func.now())
    is_signup_only = Column(Boolean, default=True)
    
    # Relationships
    address = relationship("UserAddress", back_populates="user", uselist=False)
    intake_form = relationship("IntakeForm", back_populates="user", uselist=False)


class UserAddress(Base):
    __tablename__ = "user_addresses"

    address_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(255), ForeignKey("users.user_id"))
    house_number = Column(String(255))
    street = Column(String(255))
    city = Column(String(255))
    postal_code = Column(String(255))
    country = Column(String(255))
    
    # Relationship with User
    user = relationship("User", back_populates="address")


class IntakeForm(Base):
    __tablename__ = "intake_forms"
    
    form_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(255), ForeignKey("users.user_id"), unique=True)
    
    # Basic Information
    measurement_system = Column(String(10))  # 'metric' or 'imperial'
    height = Column(String(20))
    weight = Column(String(20))
    age = Column(Integer)
    body_fat = Column(String(20))
    
    # Strength Training
    strength_training_experience = Column(String(10))
    strength_competency = Column(String(20))
    strength_competency_value = Column(Float)
    strength_competency_comments = Column(Text)
    bench_press_weight = Column(String(20))
    bench_press_reps = Column(String(10))
    squat_weight = Column(String(20))
    squat_reps = Column(String(10))
    chin_up_weight = Column(String(20))
    chin_up_reps = Column(String(10))
    deadlift_weight = Column(String(20))
    deadlift_reps = Column(String(10))
    overhead_press_weight = Column(String(20))
    overhead_press_reps = Column(String(10))
    
    # Goals and Exercises
    goal1 = Column(Text)
    goal2 = Column(Text)
    goal3 = Column(Text)
    obstacle = Column(Text)
    other_exercises = Column(Text)
    
    # Dedication and Training
    dedication_level = Column(String(50))
    weekly_frequency = Column(String(10))
    occupation = Column(Text)
    diet = Column(Text)
    medical_conditions = Column(Text)
    training_time_preference = Column(Text)
    
    # Health and Lifestyle
    activity_level = Column(String(50))
    stress_level = Column(String(50))
    sleep_quality = Column(String(50))
    caffeine = Column(String(50))
    menstrual_info = Column(Text)
    
    # Equipment
    fitness_tech = Column(Text)
    skinfold_calipers = Column(Text)
    has_measuring_tape = Column(Boolean)
    cardio_equipment = Column(String(255))
    gym_equipment = Column(String(255))
    leg_curl_type = Column(String(20))
    dumbbell_info = Column(Text)
    additional_equipment_info = Column(Text)
    
    # Supplements and Body Measurements
    supplements = Column(Text)
    wrist_circumference = Column(String(20))
    ankle_circumference = Column(String(20))
    
    # Current program and photos
    diet_description = Column(Text)
    training_program = Column(Text)
    body_photo_urls = Column(String(1000))
    
    # Completion tracking
    measurement_choice_completed = Column(Boolean, default=False)
    weight_height_completed = Column(Boolean, default=False)
    strength_choice_completed = Column(Boolean, default=False)
    strength1_completed = Column(Boolean, default=False)
    strength2_completed = Column(Boolean, default=False)
    goals_completed = Column(Boolean, default=False)
    other_exercise_completed = Column(Boolean, default=False)
    dedication_level_completed = Column(Boolean, default=False)
    training_frequency_completed = Column(Boolean, default=False)
    occupation_completed = Column(Boolean, default=False)
    training_time_completed = Column(Boolean, default=False)
    activity_level_completed = Column(Boolean, default=False)
    stress_level_completed = Column(Boolean, default=False)
    sleep_form_completed = Column(Boolean, default=False)
    caffeine_completed = Column(Boolean, default=False)
    equipment1_completed = Column(Boolean, default=False)
    equipment2_completed = Column(Boolean, default=False)
    equipment3_completed = Column(Boolean, default=False)
    equipment4_completed = Column(Boolean, default=False)
    supplements_completed = Column(Boolean, default=False)
    genetics_completed = Column(Boolean, default=False)
    current_program_completed = Column(Boolean, default=False)
    
    # Form completion status
    intake_form_completed = Column(Boolean, default=False)
    has_completed_payment = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationship with User
    user = relationship("User", back_populates="intake_form")