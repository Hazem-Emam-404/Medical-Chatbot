from datetime import datetime
from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator

# -------------------------------------------------------------
# Structured Clinical AI Schema (matches schema/json_schema.json)
# -------------------------------------------------------------

class SupportingEvidence(BaseModel):
    claim: str = Field(..., description="The supported clinical claim")
    citations: List[str] = Field(..., description="Citations in [Doc | Page | Section | Chunk] format")

    model_config = ConfigDict(from_attributes=True)


class MedicalResponse(BaseModel):
    status: Literal["answered", "insufficient_evidence", "safety_refusal"]
    input_risk: Optional[Literal["Critical", "High", "Medium"]] = None
    recommendation: str
    supporting_evidence: List[SupportingEvidence] = Field(default_factory=list)
    confidence: Literal["High", "Medium", "Low", "Insufficient Evidence", "safety_refusal"]
    missing_information: List[str] = Field(default_factory=list)
    follow_up_suggestions: List[str] = Field(default_factory=list, description="2-3 relevant follow-up questions")
    safety_note: str = Field(default="Educational information only; not a diagnosis or medical advice.")

    model_config = ConfigDict(from_attributes=True)


# -------------------------------------------------------------
# User & Auth Schemas
# -------------------------------------------------------------

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100, description="Full Name of the clinician")
    email: EmailStr = Field(..., description="Work/Professional email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 characters)")

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Full name must be at least 2 characters long.")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered email address")
    password: str = Field(..., description="Account password")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.strip().lower()


class UserUpdateProfileRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=6, max_length=128)

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if len(v) < 2:
                raise ValueError("Full name must be at least 2 characters long.")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.strip().lower()
        return v


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# -------------------------------------------------------------
# Message & Chat Schemas
# -------------------------------------------------------------

class CreateChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Initial clinical query to start the consultation")
    history: Optional[List[Dict[str, Any]]] = Field(default=None, description="Optional past turns for guest sessions")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty or blank.")
        return v


class SendMessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="Follow-up clinical question")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Message cannot be empty or blank.")
        return v


class MessageResponse(BaseModel):
    id: Optional[int] = None
    chat_id: Optional[int] = None
    sender: Literal["human", "ai"]
    content_text: Optional[str] = None
    ai_response_json: Optional[Dict[str, Any]] = None
    is_bookmarked: bool = False
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatQueryResponse(BaseModel):
    chat_id: Optional[int] = None
    title: Optional[str] = None
    is_saved: bool = False
    user_message: MessageResponse
    ai_response: MessageResponse

    model_config = ConfigDict(from_attributes=True)


class ChatResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ChatListResponse(BaseModel):
    id: int
    title: str
    created_at: datetime
    updated_at: datetime
    last_message_preview: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class BookmarkToggleResponse(BaseModel):
    message_id: int
    is_bookmarked: bool


# -------------------------------------------------------------
# Unified Error Response Schema
# -------------------------------------------------------------

class ErrorResponse(BaseModel):
    status_code: int = Field(..., description="HTTP Status Code")
    message: str = Field(..., description="Summary status message (e.g. Bad Request, Unauthorized)")
    detailed_message: Any = Field(..., description="Detailed description or validation details")
    timestamp: str = Field(..., description="ISO 8601 UTC timestamp")

    model_config = ConfigDict(from_attributes=True)

