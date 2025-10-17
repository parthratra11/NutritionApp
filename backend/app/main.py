from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import user_models, intake_models
from app.routers import users, goals, intake_forms, address

# Create tables
user_models.Base.metadata.create_all(bind=engine)
intake_models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cymron API",
    description="API for Cymron fitness app",
    version="1.0.0"
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)
app.include_router(goals.router)
app.include_router(intake_forms.router)
app.include_router(address.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Cymron API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)