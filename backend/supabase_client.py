from supabase import create_client, Client
from backend.config import settings

# Shared Supabase Client instance for the entire backend application
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
