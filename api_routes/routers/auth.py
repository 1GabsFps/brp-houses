import os
import requests
import datetime
import jwt
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel
from dotenv import load_dotenv

from api_routes.dependencies import JWT_SECRET

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

CLIENT_ID = os.getenv("DISCORD_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")
REDIRECT_URI = os.getenv("DISCORD_REDIRECT_URI", "")

class LoginRequest(BaseModel):
    code: str
    redirect_uri: str

class TestLoginRequest(BaseModel):
    user_id: str
    username: str
    guild_id: str

@router.post("/login")
async def discord_login(payload: LoginRequest, request: Request):
    bot = request.app.state.bot

    if not CLIENT_ID or not CLIENT_SECRET or not REDIRECT_URI:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Configurações de OAuth2 do Discord ausentes no arquivo .env do bot.",
        )

    # 1. Troca o código pelo access token
    data = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "authorization_code",
        "code": payload.code,
        "redirect_uri": payload.redirect_uri,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    r = requests.post("https://discord.com/api/oauth2/token", data=data, headers=headers)
    
    if r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Erro ao trocar código de autorização: {r.text}",
        )

    token_data = r.json()
    access_token = token_data.get("access_token")

    # 2. Busca informações do usuário autenticado
    user_headers = {"Authorization": f"Bearer {access_token}"}
    user_r = requests.get("https://discord.com/api/users/@me", headers=user_headers)
    
    if user_r.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erro ao obter informações do usuário no Discord.",
        )

    user_info = user_r.json()
    user_id = int(user_info["id"])
    username = user_info["username"]
    avatar_hash = user_info.get("avatar")
    
    if avatar_hash:
        avatar_url = f"https://cdn.discordapp.com/avatars/{user_id}/{avatar_hash}.png"
    else:
        avatar_url = "https://cdn.discordapp.com/embed/avatars/0.png"

    # 3. Verifica servidores compartilhados para extrair a guilda principal
    guilds_r = requests.get("https://discord.com/api/users/@me/guilds", headers=user_headers)
    user_guilds = guilds_r.json() if guilds_r.status_code == 200 else []
    
    shared_guilds = []
    guild_id = 0
    for ug in user_guilds:
        gid = int(ug["id"])
        guild = bot.get_guild(gid)
        if guild:
            shared_guilds.append({
                "id": str(gid),
                "name": guild.name,
                "icon_url": str(guild.icon.url) if guild.icon else None
            })
            if not guild_id:
                guild_id = gid

    if not guild_id:
        if bot.guilds:
            guild_id = bot.guilds[0].id
            shared_guilds.append({
                "id": str(guild_id),
                "name": bot.guilds[0].name,
                "icon_url": str(bot.guilds[0].icon.url) if bot.guilds[0].icon else None
            })

    # 4. Gera JWT de sessão
    exp_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    session_token = jwt.encode(
        {
            "user_id": str(user_id),
            "username": username,
            "avatar_url": avatar_url,
            "guild_id": str(guild_id),
            "exp": exp_time,
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    return {
        "token": session_token,
        "user": {
            "id": str(user_id),
            "username": username,
            "avatar_url": avatar_url,
            "guild_id": str(guild_id),
            "guilds": shared_guilds,
        }
    }

@router.post("/test-login")
async def test_login(payload: TestLoginRequest, request: Request):
    # Bloqueia em produção
    environment = os.getenv("ENVIRONMENT", "production")
    if environment != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Este endpoint está desabilitado em produção."
        )

    bot = request.app.state.bot
    exp_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    avatar_url = "https://cdn.discordapp.com/embed/avatars/1.png"
    
    session_token = jwt.encode(
        {
            "user_id": payload.user_id,
            "username": payload.username,
            "avatar_url": avatar_url,
            "guild_id": payload.guild_id,
            "exp": exp_time,
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    guild = bot.get_guild(int(payload.guild_id))
    guild_name = guild.name if guild else "Servidor de Teste"
    guild_icon = str(guild.icon.url) if guild and guild.icon else None

    test_guilds = [{
        "id": payload.guild_id,
        "name": guild_name,
        "icon_url": guild_icon
    }]

    for g in bot.guilds:
        if g.id != int(payload.guild_id):
            test_guilds.append({
                "id": str(g.id),
                "name": g.name,
                "icon_url": str(g.icon.url) if g.icon else None
            })

    return {
        "token": session_token,
        "user": {
            "id": payload.user_id,
            "username": payload.username,
            "avatar_url": avatar_url,
            "guild_id": payload.guild_id,
            "guilds": test_guilds,
        }
    }
