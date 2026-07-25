from __future__ import annotations
import os
import discord
from discord import app_commands
from discord.ext import commands
from dotenv import load_dotenv
from database import Database
from views import BauChannelView, MainPanelView

load_dotenv()

TOKEN = os.getenv("DISCORD_TOKEN")
if not TOKEN:
    raise RuntimeError(
        "Defina a variável de ambiente DISCORD_TOKEN no seu arquivo .env."
    )


class Bot(commands.Bot):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.db = Database()

    async def setup_hook(self):
        # Inicializa o banco de dados e as tabelas
        await self.db.setup()

        # Registra a view persistente no event loop do Discord
        self.add_view(BauChannelView(self.db))

        # Carrega os Cogs modulares
        await self.load_extension("cogs.bank")
        await self.load_extension("cogs.chests")
        await self.load_extension("cogs.admin")

        # Inicializa o servidor FastAPI de forma concorrente no mesmo loop
        from api import create_app
        import uvicorn

        self.api_app = create_app(self)
        config = uvicorn.Config(
            self.api_app,
            host="0.0.0.0",
            port=8000,
            log_level="info",
            loop="asyncio",
        )
        self.api_server = uvicorn.Server(config)
        self.loop.create_task(self.api_server.serve())

        # Sincroniza comandos globais de barra
        await self.tree.sync()

    async def on_ready(self):
        print(f"Logado como {self.user} ({self.user.id})")


intents = discord.Intents.default()
intents.guilds = True
intents.members = True
intents.message_content = True

bot = Bot(command_prefix="!", intents=intents)


@bot.tree.command(name="painel", description="Abre o painel do sistema")
async def painel(interaction: discord.Interaction):
    if not interaction.guild:
        return await interaction.response.send_message("❌ Use este comando em um servidor.", ephemeral=True)

    view = MainPanelView(bot.db, interaction.guild.id, interaction.user.id)
    await view.initialize()
    await interaction.response.send_message(embed=view.embed, view=view)


if __name__ == "__main__":
    bot.run(TOKEN)