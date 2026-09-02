from supabase import create_client, Client
from backend.config import settings

# Private instance variable initialized as None
_supabase_client: Client | None = None

def get_supabase() -> Client:
    """
    Lazy getter for the Supabase client.
    Initializes and returns the client instance on first access.
    """
    global _supabase_client
    if _supabase_client is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
            raise RuntimeError(
                "Supabase initialization failed: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from environment variables."
            )
        _supabase_client = create_client(
            settings.SUPABASE_URL, 
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _supabase_client