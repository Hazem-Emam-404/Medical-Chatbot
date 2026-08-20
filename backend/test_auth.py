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

def assert_unified_error(response_json: dict, expected_status: int):
    """Verify that the response matches the unified error structure."""
    assert "status_code" in response_json, "Missing 'status_code' in error response"
    assert "message" in response_json, "Missing 'message' in error response"
    assert "detailed_message" in response_json, "Missing 'detailed_message' in error response"
    assert "timestamp" in response_json, "Missing 'timestamp' in error response"
    assert response_json["status_code"] == expected_status, f"Expected status_code={expected_status}, got {response_json['status_code']}"

def run_auth_and_model_tests():
    print("=== 1. Setting up Database Tables ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clean up existing test user if present
    test_email = "dr.test@hospital.org"
    existing = db.query(User).filter(User.email == test_email).first()
    if existing:
        db.delete(existing)
        db.commit()

    print("\n=== 2. Testing Unified Error Response on Validations (HTTP 422) ===")
    # Test short password (< 6 characters)
    short_pw_resp = client.post("/api/auth/signup", json={
        "full_name": "Dr. Tester",
        "email": test_email,
        "password": "123"
    })
    assert short_pw_resp.status_code == 422
    err_json = short_pw_resp.json()
    assert_unified_error(err_json, 422)
    print(f" [PASS] Unified 422 Error verified: {err_json['detailed_message']}")

    # Test invalid email format
    bad_email_resp = client.post("/api/auth/signup", json={
        "full_name": "Dr. Tester",
        "email": "not-an-email",
        "password": "password123"
    })
    assert bad_email_resp.status_code == 422
    assert_unified_error(bad_email_resp.json(), 422)
    print(" [PASS] Invalid email rejected with unified schema")

    print("\n=== 3. Testing User Signup ===")
    signup_resp = client.post("/api/auth/signup", json={
        "full_name": "Dr. Sarah Connor",
        "email": test_email,
        "password": "securepassword123"
    })
    assert signup_resp.status_code == 201, f"Expected 201 on signup, got {signup_resp.status_code}: {signup_resp.text}"
    signup_data = signup_resp.json()
    assert "access_token" in signup_data
    assert signup_data["user"]["email"] == test_email
    assert signup_data["user"]["full_name"] == "Dr. Sarah Connor"
    token = signup_data["access_token"]
    user_id = signup_data["user"]["id"]
    print(f" [PASS] User signed up successfully. ID: {user_id}, Token: {token[:20]}...")

    print("\n=== 4. Testing Duplicate Email Signup with Unified 400 Error ===")
    dup_resp = client.post("/api/auth/signup", json={
        "full_name": "Dr. Clone",
        "email": test_email,
        "password": "anotherpassword123"
    })
    assert dup_resp.status_code == 400
    dup_err = dup_resp.json()
    assert_unified_error(dup_err, 400)
    print(f" [PASS] Unified 400 Error verified: {dup_err['detailed_message']}")

    print("\n=== 5. Testing Login with Unified 401 Error ===")
    # Bad credentials
    bad_login = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401
    bad_login_err = bad_login.json()
    assert_unified_error(bad_login_err, 401)
    print(f" [PASS] Unified 401 Error verified: {bad_login_err['detailed_message']}")

    # Correct credentials
    login_resp = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "securepassword123"
    })
    assert login_resp.status_code == 200, f"Expected 200 on valid login, got {login_resp.status_code}"
    auth_header = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}
    print(" [PASS] User login successful with JWT returned")

    print("\n=== 6. Testing /api/auth/me (Protected Route) ===")
    me_resp = client.get("/api/auth/me", headers=auth_header)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == test_email
    assert me_data["full_name"] == "Dr. Sarah Connor"
    print(f" [PASS] /api/auth/me verified for user '{me_data['full_name']}'")

    print("\n=== 7. Testing /api/auth/profile Update ===")
    update_resp = client.put("/api/auth/profile", headers=auth_header, json={
        "full_name": "Dr. Sarah Connor, MD",
        "new_password": "newsupersecretpassword"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["full_name"] == "Dr. Sarah Connor, MD"

    # Verify login with new password
    new_login_resp = client.post("/api/auth/login", json={
        "email": test_email,
        "password": "newsupersecretpassword"
    })
    assert new_login_resp.status_code == 200
    print(" [PASS] Profile updated and new password verified")

    print("\n=== 8. Testing Chat & Message DB Models with Structured Clinical Schema ===")
    # Create a Chat thread
    new_chat = Chat(user_id=user_id, title="Hypertension in High-Risk CVD Patients")
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    # Add Human message
    human_msg = Message(
        chat_id=new_chat.id,
        sender="human",
        content_text="What is the target blood pressure for a patient with known cardiovascular disease?"
    )
    db.add(human_msg)

    # Add AI message conforming to json_schema.json
    ai_structured_response = {
        "status": "answered",
        "recommendation": "For patients with hypertension and known cardiovascular disease, WHO recommends a target systolic blood pressure of <130 mmHg.",
        "supporting_evidence": [
            {
                "claim": "Target SBP goal is <130 mmHg in patients with CVD.",
                "citations": ["[file1.pdf | Page 28 | Section 3 Recommendations | Chunk file1.pdf_ch0022]"]
            }
        ],
        "confidence": "High",
        "missing_information": [],
        "safety_note": "Educational information only; not a diagnosis or medical advice."
    }

    ai_msg = Message(
        chat_id=new_chat.id,
        sender="ai",
        ai_response_json=ai_structured_response,
        is_bookmarked=True
    )
    db.add(ai_msg)
    db.commit()

    # Query back and verify
    chat_check = db.query(Chat).filter(Chat.id == new_chat.id).first()
    assert len(chat_check.messages) == 2
    assert chat_check.messages[0].sender == "human"
    assert chat_check.messages[1].sender == "ai"
    assert chat_check.messages[1].ai_response_json["status"] == "answered"
    assert chat_check.messages[1].ai_response_json["confidence"] == "High"
    assert chat_check.messages[1].is_bookmarked is True

    print(" [PASS] Chat and Message models successfully stored and retrieved structured clinical payload!")
    print("\n=======================================================")
    print(" ALL AUTHENTICATION, PROFILE & ERROR UNIFICATION TESTS PASSED 100%!")
    print("=======================================================")

    db.close()

if __name__ == "__main__":
    run_auth_and_model_tests()
