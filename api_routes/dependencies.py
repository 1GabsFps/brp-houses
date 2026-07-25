from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
import os
from typing import Optional
from database import Database

router = APIRouter(prefix="/api", tags=["Dependencies"])

# Instância global compartilhada da Database
db = Database()

def get_db() -> Database:
    return db

# Carrega o JWT_SECRET do ambiente. Obrigatório.
JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError(
        "ERRO FATAL: JWT_SECRET não foi definido no arquivo .env! "
        "Gere um segredo seguro e adicione JWT_SECRET=<seu_segredo> ao .env."
    )

ALGORITHM = "HS256"

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Header Authorization ausente."
        )
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Formato do token inválido. Use 'Bearer <token>'."
        )
    
    token = parts[1]
    import jwt
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado."
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido."
        )

async def get_current_guild_id(
    request: Request,
    x_guild_id: Optional[str] = Header(None), 
    current_user: dict = Depends(get_current_user)
) -> int:
    guild_id = int(x_guild_id) if x_guild_id and x_guild_id.isdigit() else int(current_user.get("guild_id", 0))
    
    # Valida que o usuario realmente pertence a esta guild
    bot = request.app.state.bot
    guild = bot.get_guild(guild_id)
    if guild:
        user_id = int(current_user["user_id"])
        member = guild.get_member(user_id)
        if not member:
            try:
                member = await guild.fetch_member(user_id)
            except Exception:
                member = None
        if not member:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Você não é membro deste servidor."
            )
    
    return guild_id
