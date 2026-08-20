from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.db_models import User, Chat, Message
from backend.models.schemas import (
    CreateChatRequest,
    SendMessageRequest,
    ChatQueryResponse,
    ChatResponse,
    ChatListResponse,
    MessageResponse,
    BookmarkToggleResponse,
)
from backend.auth.dependencies import get_current_user, get_optional_current_user
from backend.chat.rag_pipeline import generate_with_refusal_check

chat_router = APIRouter(tags=["Clinical Chat & Conversations"])


def generate_chat_title(message_text: str) -> str:
    """Generate a clean initial chat title from the first message."""
    clean = message_text.strip()
    if len(clean) <= 50:
        return clean
    return clean[:47] + "..."


# -------------------------------------------------------------
# 1. Create Consultation / Start Chat (Supports Guest + Auth)
# -------------------------------------------------------------

@chat_router.post(
    "/api/chat", 
    response_model=ChatQueryResponse, 
    status_code=status.HTTP_201_CREATED,
    summary="Start a new consultation with an initial clinical query"
)
@chat_router.post(
    "/api/conversations", 
    response_model=ChatQueryResponse, 
    status_code=status.HTTP_201_CREATED, 
    include_in_schema=False
)
def create_chat(
    req: CreateChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
):
    """
    Start a new clinical consultation with a required initial message.
    - If Authenticated: Creates a persistent Chat & Messages in the database.
    - If Guest: Generates the evidence-grounded AI answer without saving to the DB.
    """
    # 1. Run the RAG pipeline to generate evidence-grounded response
    user_name = current_user.full_name if current_user else None
    ai_structured_response = generate_with_refusal_check(
        req.message, 
        chat_history=req.history,
        user_name=user_name
    )
    title = generate_chat_title(req.message)
    now = datetime.now(timezone.utc)

    # 2. If user is authenticated, persist to database
    if current_user:
        new_chat = Chat(
            user_id=current_user.id,
            title=title,
            created_at=now,
            updated_at=now,
        )
        db.add(new_chat)
        db.commit()
        db.refresh(new_chat)

        human_msg = Message(
            chat_id=new_chat.id,
            sender="human",
            content_text=req.message,
            created_at=now,
        )
        ai_msg = Message(
            chat_id=new_chat.id,
            sender="ai",
            ai_response_json=ai_structured_response,
            created_at=now,
        )
        db.add(human_msg)
        db.add(ai_msg)
        db.commit()
        db.refresh(human_msg)
        db.refresh(ai_msg)

        return ChatQueryResponse(
            chat_id=new_chat.id,
            title=new_chat.title,
            is_saved=True,
            user_message=MessageResponse.model_validate(human_msg),
            ai_response=MessageResponse.model_validate(ai_msg),
        )

    # 3. If guest, return the AI answer without DB persistence
    return ChatQueryResponse(
        chat_id=None,
        title=title,
        is_saved=False,
        user_message=MessageResponse(
            id=None,
            chat_id=None,
            sender="human",
            content_text=req.message,
            created_at=now,
        ),
        ai_response=MessageResponse(
            id=None,
            chat_id=None,
            sender="ai",
            ai_response_json=ai_structured_response,
            created_at=now,
        ),
    )


# -------------------------------------------------------------
# 2. Send Follow-up Message to Existing Conversation (Auth Only)
# -------------------------------------------------------------

@chat_router.post(
    "/api/chat/{chat_id}/messages", 
    response_model=ChatQueryResponse,
    summary="Send a follow-up question in an existing conversation"
)
@chat_router.post(
    "/api/conversations/{chat_id}/messages", 
    response_model=ChatQueryResponse, 
    include_in_schema=False
)
def send_message(
    chat_id: int,
    req: SendMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a follow-up message to an existing consultation thread with conversation context."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation thread not found or access denied."
        )

    now = datetime.now(timezone.utc)
    
    # Extract prior turns for context
    past_history = [
        {
            "sender": msg.sender,
            "content": msg.content_text if msg.sender == "human" else (msg.ai_response_json.get("recommendation", "") if msg.ai_response_json else "")
        }
        for msg in chat.messages
    ]

    user_name = current_user.full_name if current_user else None
    ai_structured_response = generate_with_refusal_check(
        req.message, 
        chat_history=past_history,
        user_name=user_name
    )

    human_msg = Message(
        chat_id=chat.id,
        sender="human",
        content_text=req.message,
        created_at=now,
    )
    ai_msg = Message(
        chat_id=chat.id,
        sender="ai",
        ai_response_json=ai_structured_response,
        created_at=now,
    )
    db.add(human_msg)
    db.add(ai_msg)

    chat.updated_at = now
    db.commit()
    db.refresh(human_msg)
    db.refresh(ai_msg)

    return ChatQueryResponse(
        chat_id=chat.id,
        title=chat.title,
        is_saved=True,
        user_message=MessageResponse.model_validate(human_msg),
        ai_response=MessageResponse.model_validate(ai_msg),
    )


# -------------------------------------------------------------
# 3. List All User Conversations (Auth Only)
# -------------------------------------------------------------

@chat_router.get(
    "/api/chat", 
    response_model=List[ChatListResponse],
    summary="List all past conversations for the current clinician"
)
@chat_router.get(
    "/api/conversations", 
    response_model=List[ChatListResponse], 
    include_in_schema=False
)
def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all conversations belonging to the authenticated user."""
    chats = db.query(Chat).filter(Chat.user_id == current_user.id).order_by(Chat.updated_at.desc()).all()
    
    result = []
    for chat in chats:
        last_msg = chat.messages[-1] if chat.messages else None
        preview = None
        if last_msg:
            if last_msg.sender == "human":
                preview = last_msg.content_text
            elif last_msg.ai_response_json:
                preview = last_msg.ai_response_json.get("recommendation", "")
        
        result.append(ChatListResponse(
            id=chat.id,
            title=chat.title,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            last_message_preview=preview[:80] if preview else None
        ))
    return result


# -------------------------------------------------------------
# 4. Get Single Conversation with Full History (Auth Only)
# -------------------------------------------------------------

@chat_router.get(
    "/api/chat/{chat_id}", 
    response_model=ChatResponse,
    summary="Get all messages in a specific consultation"
)
@chat_router.get(
    "/api/conversations/{chat_id}", 
    response_model=ChatResponse, 
    include_in_schema=False
)
def get_conversation(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full message history for a consultation thread."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation thread not found."
        )
    return ChatResponse.model_validate(chat)


# -------------------------------------------------------------
# 5. Delete a Conversation (Auth Only)
# -------------------------------------------------------------

@chat_router.delete(
    "/api/chat/{chat_id}",
    summary="Delete a consultation thread"
)
@chat_router.delete(
    "/api/conversations/{chat_id}", 
    include_in_schema=False
)
def delete_conversation(
    chat_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a conversation and all its associated messages."""
    chat = db.query(Chat).filter(Chat.id == chat_id, Chat.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consultation thread not found."
        )
    db.delete(chat)
    db.commit()
    return {"detail": "Conversation deleted successfully."}


# -------------------------------------------------------------
# 6. Bookmarking Endpoints
# -------------------------------------------------------------

@chat_router.post(
    "/api/messages/{message_id}/bookmark", 
    response_model=BookmarkToggleResponse,
    summary="Toggle bookmark status on a message"
)
def toggle_bookmark(
    message_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle bookmark on a message owned by the current user."""
    message = (
        db.query(Message)
        .join(Chat, Message.chat_id == Chat.id)
        .filter(Message.id == message_id, Chat.user_id == current_user.id)
        .first()
    )
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found."
        )

    message.is_bookmarked = not message.is_bookmarked
    db.commit()
    db.refresh(message)
    return BookmarkToggleResponse(message_id=message.id, is_bookmarked=message.is_bookmarked)


@chat_router.get(
    "/api/bookmarks", 
    response_model=List[MessageResponse],
    summary="Get all bookmarked responses for the current user"
)
def get_bookmarks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all bookmarked messages for the authenticated user."""
    bookmarked_messages = (
        db.query(Message)
        .join(Chat, Message.chat_id == Chat.id)
        .filter(Chat.user_id == current_user.id, Message.is_bookmarked == True)
        .order_by(Message.created_at.desc())
        .all()
    )
    return [MessageResponse.model_validate(msg) for msg in bookmarked_messages]
