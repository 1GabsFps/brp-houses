from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from database import Database

from api_routes.dependencies import get_db, get_current_user, get_current_guild_id

router = APIRouter(prefix="/api/bank", tags=["bank"])

class BalanceUpdateRequest(BaseModel):
    amount: int
    reason: Optional[str] = ""

@router.get("/balance")
async def get_balance(
    guild_id: int = Depends(get_current_guild_id), 
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_id = int(current_user["user_id"])

    balance, earned, spent = await db.get_balance(guild_id, user_id)
    raw_history = await db.get_balance_history(guild_id, user_id)
    
    history = []
    for amount, type_, balance_after, reason, created_at in raw_history:
        history.append({
            "amount": amount,
            "type": type_,
            "balance_after": balance_after,
            "reason": reason,
            "date": created_at
        })

    return {
        "balance": balance,
        "earned": earned,
        "spent": spent,
        "history": history
    }

@router.post("/update")
async def update_user_balance(
    payload: BalanceUpdateRequest, 
    request: Request,
    guild_id: int = Depends(get_current_guild_id), 
    current_user: dict = Depends(get_current_user),
    db: Database = Depends(get_db)
):
    user_id = int(current_user["user_id"])

    await db.update_balance(guild_id, user_id, payload.amount, payload.reason)
    
    action = "bank_add" if payload.amount >= 0 else "bank_remove"
    val = abs(payload.amount)
    sig = "+" if payload.amount >= 0 else "-"
    await db.log_action(guild_id, action, f"Web Panel: {current_user['username']} {sig}{val} | {payload.reason}", user_id)

    # Notifica canal de logs se houver
    bot = request.app.state.bot
    guild = bot.get_guild(guild_id)
    if guild:
        pass # placeholder para hooks de views

    return {"status": "success", "new_amount": payload.amount}
