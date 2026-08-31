import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "QuantumCraft API")
    ENV: str = os.getenv("ENV", "development")
    
    # Supabase Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # AI Services Keys
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Security Setup
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-change-me")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    class Config:
        env_file = ".env"
        extra = "ignore"  # Prevents errors if extra variables exist in .env

settings = Settings()