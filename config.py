from __future__ import annotations
import re
import unicodedata
import discord

def display_name_for(guild: discord.Guild | None, user_id: int, client: discord.Client | None = None) -> str:
    if guild:
        member = guild.get_member(user_id)
        if member:
            return member.display_name
    if client:
        user = client.get_user(user_id)
        if user:
            return user.name
    return f"Usuário {user_id}"


def get_avatar_url(guild: discord.Guild | None, user_id: int, client: discord.Client | None = None) -> str | None:
    if guild:
        member = guild.get_member(user_id)
        if member:
            return member.display_avatar.url
    if client:
        user = client.get_user(user_id)
        if user:
            return user.display_avatar.url
    return None


# Emojis e aliases para os itens do baú
ITEM_EMOJIS = {
    "diamante": "💎",
    "platina": "🔷",
    "ouro": "🏆",
    "prata": "🥈",
    "cobre": "🥉",
    "caixa de leite": "🥛",
    "balde vazio": "🪣",
    "papelao": "📦",
    "ferro": "🔩",
    "pedra": "🪨",
    "carvao": "⚫",
    "anel de ouro": "💍",
    "colar de ouro": "📿",
    "brincos de ouro": "🧿",
    "anel de prata": "🪙",
    "colar de prata": "🔗",
    "pulseira de cobre": "🪢",
    "anel de cobre": "🔔",
    "pingente de ferro": "🧲",
    "anel de diamante": "💠",
    "colar de rubi": "🔴",
    "anel de rubi": "🔺",
}
DEFAULT_ITEM_EMOJI = "📦"

ALIASES = {
    # leite / recipientes
    "caxa de leite": "caixa de leite",
    "caixa de leit": "caixa de leite",
    "caixas de leite": "caixa de leite",
    "caixa leite": "caixa de leite",
    "caixas leite": "caixa de leite",

    # minérios / materiais
    "diamante": "diamante",
    "diamantes": "diamante",
    "gema": "diamante",
    "gemas": "diamante",

    "platina": "platina",
    "platinum": "platina",

    "ouro": "ouro",
    "dourado": "ouro",

    "prata": "prata",
    "prateado": "prata",

    "cobre": "cobre",
    "cobres": "cobre",

    "ferro": "ferro",
    "ferros": "ferro",

    "pedra": "pedra",
    "pedras": "pedra",
    "rocha": "pedra",
    "rochas": "pedra",

    "carvao": "carvao",
    "carvoes": "carvao",
    "carvao vegetal": "carvao",
    "carvão": "carvao",

    "papelao": "papelao",
    "papeloes": "papelao",
    "papel": "papelao",
    "papelão": "papelao",

    "balde vazio": "balde vazio",
    "balde": "balde vazio",

    # joias
    "anel de ouro": "anel de ouro",
    "anel ouro": "anel de ouro",
    "anel dourado": "anel de ouro",

    "colar de ouro": "colar de ouro",
    "colar ouro": "colar de ouro",
    "colar dourado": "colar de ouro",

    "brincos de ouro": "brincos de ouro",
    "brinco de ouro": "brincos de ouro",
    "brincos ouro": "brincos de ouro",

    "anel de prata": "anel de prata",
    "anel prata": "anel de prata",

    "colar de prata": "colar de prata",
    "colar prata": "colar de prata",

    "pulseira de cobre": "pulseira de cobre",
    "pulseira cobre": "pulseira de cobre",

    "anel de cobre": "anel de cobre",
    "anel cobre": "anel de cobre",

    "pingente de ferro": "pingente de ferro",
    "pingente ferro": "pingente de ferro",

    "anel de diamante": "anel de diamante",
    "anel diamante": "anel de diamante",

    "colar de rubi": "colar de rubi",
    "colar rubi": "colar de rubi",

    "anel de rubi": "anel de rubi",
    "anel rubi": "anel de rubi",
}


def normalize_text(text: str) -> str:
    text = text.strip().lower()
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"\s+", " ", text)
    return text


def normalize_item_name(item_name: str) -> str:
    item_name = normalize_text(item_name)
    return ALIASES.get(item_name, item_name)


def item_emoji(item_name: str) -> str:
    return ITEM_EMOJIS.get(normalize_item_name(item_name), DEFAULT_ITEM_EMOJI)


def parse_item_line(content: str):
    content = normalize_text(content)
    match = re.match(r"^(\d+)\s+(.+)$", content)
    if not match:
        return None

    qty = int(match.group(1))
    item_name = normalize_item_name(match.group(2))
    if qty <= 0 or not item_name:
        return None

    return qty, item_name


def parse_items_multiline(content: str):
    lines = content.strip().split('\n')
    items = []

    for line in lines:
        parsed = parse_item_line(line)
        if parsed:
            items.append(parsed)

    return items if items else None
