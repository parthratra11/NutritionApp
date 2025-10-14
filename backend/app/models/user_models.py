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
    # intake_form will be defined in intake_models.py


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