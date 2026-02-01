from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from src.api.chat_endpoint import router as chat_router
from src.api.auth_endpoint import router as auth_router
from src.middleware.auth_middleware import JWTBearer

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="AI-Powered Todo Chatbot API",
    description="API for the AI-powered todo chatbot system",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React dev server
        "http://localhost:8000",  # Backend server
        "http://127.0.0.1:8000",  # Alternative localhost
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",  # Alternative Vite dev server
        "https://*.vercel.app",    # Vercel deployments
        "https://*.netlify.app",   # Netlify deployments
        "https://*.github.io",     # GitHub Pages
        "*"  # In development only - restrict in production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add authentication middleware
jwt_bearer = JWTBearer()

# Include API routes
app.include_router(chat_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

# Add a basic health check endpoint
@app.get("/")
def read_root():
    return {"message": "AI-Powered Todo Chatbot API", "status": "running"}

# Add a health check endpoint
@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": __import__('datetime').datetime.utcnow().isoformat()}

# Error handlers
@app.exception_handler(404)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "NOT_FOUND",
                "message": "The requested resource was not found"
            }
        }
    )

@app.exception_handler(400)
async def bad_request_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": "BAD_REQUEST",
                "message": str(exc.detail) if hasattr(exc, 'detail') else "Bad request"
            }
        }
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal server error occurred"
            }
        }
    )

# Run the application with uvicorn when executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=True if os.getenv("APP_ENV") == "development" else False
    )