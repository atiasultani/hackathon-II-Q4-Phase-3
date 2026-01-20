from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI(
    title="FastAPI CRUD Application",
    description="A complete CRUD application generated with FastAPI CRUD Generator",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
from routes.users import router as users_router
from routes.posts import router as posts_router

app.include_router(users_router, prefix="/api/v1")
app.include_router(posts_router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Welcome to FastAPI CRUD Application"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}