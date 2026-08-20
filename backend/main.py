import sys
import os
import http
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from typing import Any

# Ensure the root project directory (AI-Hackathon) is in sys.path so 'backend.xxx' imports work
# regardless of whether the app is started from the root directory or inside the backend folder.
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PARENT_DIR = os.path.dirname(CURRENT_DIR)
if PARENT_DIR not in sys.path:
    sys.path.insert(0, PARENT_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from backend.database import engine, Base
import backend.models.db_models  # Ensure models are registered with Base metadata
from backend.auth.router import auth_router
from backend.chat.router import chat_router
from backend.documents.router import documents_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on application startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="ClinicianMind AI Backend",
    description="Evidence-grounded Clinical Decision Support API powered by FastAPI, ChromaDB, and Groq LLMs.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------
# Unified Error Response Handlers
# -------------------------------------------------------------

def build_error_response(status_code: int, message: str, detailed_message: Any) -> JSONResponse:
    """Helper to produce standard unified error JSON response."""
    return JSONResponse(
        status_code=status_code,
        content={
            "detailed_message": detailed_message,
            "status_code": status_code,
            "message": message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle all standard HTTPExceptions with the unified format."""
    try:
        status_phrase = http.HTTPStatus(exc.status_code).phrase
    except Exception:
        status_phrase = "HTTP Error"

    return build_error_response(
        status_code=exc.status_code,
        message=status_phrase,
        detailed_message=exc.detail,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic/FastAPI request validation errors (422)."""
    errors = exc.errors()
    clean_messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []) if l != "body")
        msg = err.get("msg", "Invalid value")
        clean_messages.append(f"{loc}: {msg}" if loc else msg)

    detailed_msg = "; ".join(clean_messages) if clean_messages else "Request validation failed."

    return build_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Validation Error",
        detailed_message=detailed_msg,
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    """Fallback handler for uncaught server errors (500)."""
    return build_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="Internal Server Error",
        detailed_message="An unexpected server error occurred. Please try again later.",
    )


# Register API Routers
app.include_router(auth_router)
app.include_router(chat_router)
app.include_router(documents_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    """Service health check endpoint."""
    return {"status": "healthy", "service": "ClinicianMind AI API"}


if __name__ == "__main__":
    import uvicorn
    # Works directly when executing 'python main.py' from inside the backend directory
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
