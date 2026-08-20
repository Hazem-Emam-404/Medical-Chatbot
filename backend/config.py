import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
env_file = os.path.join(BASE_DIR, ".env")
if os.path.exists(env_file):
    load_dotenv(env_file)
else:
    load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
HF_TOKEN = os.getenv("HF_TOKEN")

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "clinicianmind-super-secret-jwt-key-change-in-production-2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours

# Database Settings
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'clinicianmind.db')}")

if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set in the environment variables.")
if not HF_TOKEN:
    print("WARNING: HF_TOKEN is not set in the environment variables.")
