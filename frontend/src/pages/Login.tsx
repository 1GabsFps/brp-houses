import { useEffect, useState } from "react";
import { apiService } from "../api";
import { ShieldCheck, ArrowRight, User } from "lucide-react";
import toast from "react-hot-toast";

export default function Login() {
  const [testUserId, setTestUserId] = useState("123456789012345678");
  const [testUsername, setTestUsername] = useState("TestUser");
  const [testGuildId, setTestGuildId] = useState("987654321098765432");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Processa o retorno do Discord OAuth2 caso haja o parâmetro 'code' na URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      setLoading(true);
      const redirectUri = `${window.location.origin}/callback`;

      apiService
        .loginWithDiscord(code, redirectUri)
        .then((data) => {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("guild_id", data.user.guild_id);
          localStorage.setItem("guilds", JSON.stringify(data.user.guilds));
          window.location.href = "/";
        })
        .catch((err) => {
          toast.error("Erro ao autenticar com Discord: " + (err.response?.data?.detail || err.message));
          setLoading(false);
        });
    }
  }, []);

  const handleDiscordLogin = () => {
    const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || "1298809208413618217";
    const redirectUri = encodeURIComponent(`${window.location.origin}/callback`);
    const scope = encodeURIComponent("identify guilds");

    window.location.href = `https://discord.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
  };

  const handleTestLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    apiService
      .loginTest(testUserId, testUsername, testGuildId)
      .then((data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("guild_id", data.user.guild_id);
        localStorage.setItem("guilds", JSON.stringify(data.user.guilds));
        window.location.href = "/";
      })
      .catch((err) => {
        toast.error("Erro no login de teste: " + (err.response?.data?.detail || err.message));
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header do Login */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">BRP Houses</h1>
          <p className="text-sm text-gray-400">
            Painel Web de Gerenciamento Bancário e Baús
          </p>
        </div>

        {/* Card Principal de Autenticação */}
        <div className="p-8 rounded-2xl border border-white/5 bg-[#0b0c10]/80 backdrop-blur-xl shadow-2xl space-y-6">
          <button
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-bold text-base transition duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[#5865F2]/20 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.093.252-.19.37-.287a.075.075 0 0 1 .078-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.098.245.195.372.288a.077.077 0 0 1-.006.128 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z\" />
            </svg>
            Entrar com Discord
          </button>

          {/* Dev Test Login Section */}
          <div className="pt-4 border-t border-white/5 space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 block text-center">
              Ou Teste no Ambiente de Desenvolvimento
            </span>

            <form onSubmit={handleTestLogin} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                  User ID
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="18 dígitos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={testUsername}
                    onChange={(e) => setTestUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Guild ID
                  </label>
                  <input
                    type="text"
                    value={testGuildId}
                    onChange={(e) => setTestGuildId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-xs text-gray-300 font-semibold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                Login Rápido de Teste <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
