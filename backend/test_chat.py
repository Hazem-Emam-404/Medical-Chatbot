import os
import sys
import json

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import SessionLocal, Base, engine
from backend.models.db_models import User, Chat, Message

client = TestClient(app)

def run_chat_tests():
    print("=== 1. Setting up Database & Authenticated User ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    test_email = "dr.chat.tester@hospital.org"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()

    # Signup test user
    signup_resp = client.post("/api/auth/signup", json={
        "full_name": "Dr. House",
        "email": test_email,
        "password": "differentialdiag123"
    })
    assert signup_resp.status_code == 201
    auth_token = signup_resp.json()["access_token"]
    auth_header = {"Authorization": f"Bearer {auth_token}"}
    print(" [PASS] Test user created and authenticated.")

    print("\n=== 2. Testing Empty Message Validation (Cannot create empty chat) ===")
    empty_resp = client.post("/api/chat", json={"message": "   "})
    assert empty_resp.status_code == 422, f"Expected 422 for empty message, got {empty_resp.status_code}"
    print(f" [PASS] Empty message rejected: {empty_resp.json()['detailed_message']}")

    print("\n=== 3. Testing Guest Consultation (Unauthenticated User) ===")
    guest_query = "What is the recommended blood pressure threshold for initiating treatment in adults?"
    guest_resp = client.post("/api/chat", json={"message": guest_query})
    assert guest_resp.status_code == 201, f"Expected 201, got {guest_resp.status_code}: {guest_resp.text}"
    guest_data = guest_resp.json()
    assert guest_data["is_saved"] is False, "Guest query should not be marked as saved"
    assert guest_data["chat_id"] is None, "Guest query should have chat_id=None"
    assert guest_data["ai_response"]["ai_response_json"] is not None
    assert "recommendation" in guest_data["ai_response"]["ai_response_json"]
    print(f" [PASS] Guest chat responded without saving to DB. Title: '{guest_data['title']}'")

    print("\n=== 4. Testing Authenticated Consultation (Creating Persistent Chat) ===")
    auth_query = "What is the systolic blood pressure target for patients with cardiovascular disease?"
    auth_chat_resp = client.post("/api/chat", headers=auth_header, json={"message": auth_query})
    assert auth_chat_resp.status_code == 201, f"Expected 201, got {auth_chat_resp.status_code}: {auth_chat_resp.text}"
    chat_data = auth_chat_resp.json()
    assert chat_data["is_saved"] is True, "Authenticated query must be marked as saved"
    assert chat_data["chat_id"] is not None, "Authenticated query must have a chat_id"
    chat_id = chat_data["chat_id"]
    ai_msg_id = chat_data["ai_response"]["id"]
    print(f" [PASS] Authenticated chat created in DB! Chat ID: {chat_id}, Title: '{chat_data['title']}'")
    print(f" [INFO] AI Recommendation: {chat_data['ai_response']['ai_response_json']['recommendation'][:100]}...")

    print("\n=== 5. Testing Follow-up Message in Existing Chat ===")
    follow_up_query = "What if the patient is 80 years old or older?"
    follow_up_resp = client.post(f"/api/chat/{chat_id}/messages", headers=auth_header, json={"message": follow_up_query})
    assert follow_up_resp.status_code == 200, f"Expected 200, got {follow_up_resp.status_code}: {follow_up_resp.text}"
    follow_up_data = follow_up_resp.json()
    assert follow_up_data["chat_id"] == chat_id
    assert follow_up_data["user_message"]["content_text"] == follow_up_query
    print(f" [PASS] Follow-up message saved to chat {chat_id}.")

    print("\n=== 6. Testing List Conversations ===")
    list_resp = client.get("/api/chat", headers=auth_header)
    assert list_resp.status_code == 200
    conversations = list_resp.json()
    assert len(conversations) >= 1
    assert conversations[0]["id"] == chat_id
    print(f" [PASS] Listed {len(conversations)} conversation(s) for user.")

    print("\n=== 7. Testing Get Full Conversation History ===")
    hist_resp = client.get(f"/api/chat/{chat_id}", headers=auth_header)
    assert hist_resp.status_code == 200
    hist_data = hist_resp.json()
    assert len(hist_data["messages"]) == 4  # 2 questions + 2 AI answers
    print(f" [PASS] Conversation history retrieved with {len(hist_data['messages'])} messages.")

    print("\n=== 8. Testing Bookmarking ===")
    bm_resp = client.post(f"/api/messages/{ai_msg_id}/bookmark", headers=auth_header)
    assert bm_resp.status_code == 200
    assert bm_resp.json()["is_bookmarked"] is True
    print(f" [PASS] Message {ai_msg_id} bookmarked.")

    get_bm_resp = client.get("/api/bookmarks", headers=auth_header)
    assert get_bm_resp.status_code == 200
    bms = get_bm_resp.json()
    assert len(bms) >= 1
    assert bms[0]["id"] == ai_msg_id
    print(f" [PASS] Retrieved {len(bms)} bookmarked message(s).")

    print("\n=== 9. Testing Delete Conversation ===")
    del_resp = client.delete(f"/api/chat/{chat_id}", headers=auth_header)
    assert del_resp.status_code == 200
    
    # Confirm it's gone
    check_del = client.get(f"/api/chat/{chat_id}", headers=auth_header)
    assert check_del.status_code == 404
    print(f" [PASS] Conversation {chat_id} deleted successfully.")

    print("\n=======================================================")
    print(" ALL CHAT & CONVERSATION TESTS PASSED 100%!")
    print("=======================================================")
    db.close()

if __name__ == "__main__":
    run_chat_tests()
