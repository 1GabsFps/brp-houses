import React, { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Coins, Home, LogOut, Package, ShieldAlert } from "lucide-react";
import { apiService } from "../api";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const userRaw = localStorage.getItem("user");
  const user = userRaw ? JSON.parse(userRaw) : null;

  const guildsRaw = localStorage.getItem("guilds");
  const guilds = guildsRaw ? JSON.parse(guildsRaw) : [];
  const activeGuildId = localStorage.getItem("guild_id") || "";

  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    apiService.checkIsStaff()
      .then((res) => setIsStaff(res.is_staff))
      .catch(() => setIsStaff(false));
  }, [activeGuildId]);

  const handleGuildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    localStorage.setItem("guild_id", e.target.value);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("guild_id");
    localStorage.removeItem("guilds");
    window.location.href = "/login";
  };

  const navItems = [
    { path: "/", label: "Dashboard", icon: Home, show: true },
    { path: "/bank", label: "Banco", icon: Coins, show: true },
    { path: "/chests", label: "Baús", icon: Package, show: true },
    { path: "/admin", label: "Admin", icon: ShieldAlert, show: isStaff },
  ];

  return (
    <div className="min-h-screen bg-[#090a0f] text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar para desktop */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-white/5 bg-[#0b0c10]/95 backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Header do Bot */}
          <div className="p-6 flex items-center gap-3 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center">
              <span className="font-bold text-purple-400 text-sm">BRP</span>
            </div>
            <div>
              <h2 className="font-bold text-white leading-tight">BRP Houses</h2>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Painel Web</span>
            </div>
          </div>

          {/* Seletor de Servidor */}
          {guilds.length > 0 && (
            <div className="p-4 border-b border-white/5 space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Servidor Ativo</label>
              <div className="flex items-center gap-2">
                {(() => {
                  const activeGuild = guilds.find((g: any) => g.id === activeGuildId);
                  const iconUrl = activeGuild?.icon_url;
                  return iconUrl ? (
                    <img src={iconUrl} alt="" className="w-7 h-7 rounded-lg border border-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-purple-600/10 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[9px] text-purple-400 font-bold">
                        {activeGuild?.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  );
                })()}
                <select
                  value={activeGuildId}
                  onChange={handleGuildChange}
                  className="flex-1 bg-[#12131a] border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
                >
                  {guilds.map((g: any) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Links de navegação */}
          <nav className="p-4 space-y-1">
            {navItems.filter(i => i.show).map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition duration-200 ${
                    isActive
                      ? "bg-white/[0.02] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.01]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile e Logout */}
        {user && (
          <div className="p-4 border-t border-white/5 bg-white/[0.005] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={user.avatar_url}
                alt={user.username}
                className="w-10 h-10 rounded-xl border border-white/10 shadow-md"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{user.username}</p>
                <p className="text-[10px] text-gray-500 truncate">ID: {user.id}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-gray-400 transition duration-200 cursor-pointer"
              title="Sair"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
