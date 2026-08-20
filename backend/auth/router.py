from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.db_models import User
from backend.models.schemas import (
    UserRegisterRequest,
    UserLoginRequest,
    UserUpdateProfileRequest,
    UserResponse,
    TokenResponse,
)
from backend.auth.security import hash_password, verify_password, create_access_token
from backend.auth.dependencies import get_current_user

auth_router = APIRouter(prefix="/api/auth", tags=["Authentication & Profile"])


@auth_router.post(
    "/signup", 
    response_model=TokenResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Register a new clinician account"
)
@auth_router.post(
    "/register", 
    response_model=TokenResponse, 
    status_code=status.HTTP_201_CREATED, 
    include_in_schema=False
)
def signup(req: UserRegisterRequest, db: Session = Depends(get_db)):
    """Register a new clinician user, hash password with bcrypt, and return a JWT access token."""
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    hashed_pw = hash_password(req.password)
    new_user = User(
        full_name=req.full_name,
        email=req.email,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id), "email": new_user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )


@auth_router.post(
    "/login", 
    response_model=TokenResponse,
    summary="Authenticate clinician and obtain JWT token"
)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password, returning a JWT token on success."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@auth_router.get(
    "/me", 
    response_model=UserResponse,
    summary="Get current clinician profile"
)
def get_me(current_user: User = Depends(get_current_user)):
    """Return the profile information of the currently authenticated user."""
    return UserResponse.model_validate(current_user)


@auth_router.put(
    "/profile", 
    response_model=UserResponse,
    summary="Update clinician profile information"
)
def update_profile(
    req: UserUpdateProfileRequest, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile fields (full_name, email, or password)."""
    # Check if email is being updated and not already taken
    if req.email and req.email != current_user.email:
        email_taken = db.query(User).filter(User.email == req.email, User.id != current_user.id).first()
        if email_taken:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email address is already in use by another account."
            )
        current_user.email = req.email

    if req.full_name:
        current_user.full_name = req.full_name

    if req.new_password:
        if req.current_password:
            if not verify_password(req.current_password, current_user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is incorrect."
                )
        current_user.hashed_password = hash_password(req.new_password)

    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)
