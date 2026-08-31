from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from backend.config import settings

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Decodes and verifies the incoming Supabase JWT token.
    Returns a dictionary of claims if valid, otherwise raises 401.
    """
    token = credentials.credentials
    try:
        # Note: In production, verify using the secret key (JWT_SECRET / SUPABASE_JWT_SECRET)
        # If the secret is not configured yet, we can fall back to checking standard payload structures.
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_aud": False} # Supabase aud defaults to 'authenticated'
        )
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role", "student")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: Subject missing"
            )
            
        return {
            "id": user_id,
            "email": email,
            "role": role
        }
        
    except JWTError as e:
        # Fallback for mock/local testing if secret keys are not aligned in development
        if settings.ENV == "development":
            try:
                # Attempt unverified decode just to help in local development
                unverified_claims = jwt.get_unverified_claims(token)
                return {
                    "id": unverified_claims.get("sub", "00000000-0000-0000-0000-000000000000"),
                    "email": unverified_claims.get("email", "student@quantumcraft.io"),
                    "role": unverified_claims.get("role", "student")
                }
            except Exception:
                pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )
