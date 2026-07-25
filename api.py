from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Database

from api_routes.routers import auth, bank, admin, chests

def create_app(bot) -> FastAPI:
    app = FastAPI(title="Bot Dashboard API", version="2.0.0")
    
    # Armazena instâncias no state para injeção de dependência limpa
    app.state.bot = bot
    app.state.db = bot.db

    # CORS restrito aos métodos necessários
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://houses.neco.lat",
            "http://houses.neco.lat"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )

    # API status
    @app.get("/api/health")
    async def health():
        return {"status": "running", "bot_connected": bot.is_ready()}

    # Registro dos Roteadores
    app.include_router(auth.router)
    app.include_router(bank.router)
    app.include_router(admin.router)
    app.include_router(chests.router)

    return app
