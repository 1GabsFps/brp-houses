import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Coins,
  Package,
  AlertTriangle,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  ShieldAlert,
  LayoutDashboard,
} from "lucide-react";
import { apiService } from "../api";
import type { BalanceData } from "../api";

/* ───────── animation helpers ───────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function Home() {
  const userRaw = localStorage.getItem("user");
  const currentUser = userRaw ? JSON.parse(userRaw) : null;

  /* ── data state ── */
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [itemsCount, setItemsCount] = useState<number>(0);
  const [debtsCount, setDebtsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  /* ── load all summary metrics ── */
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadAll = async () => {
      try {
        // 1. Balance Data
        const bal = await apiService.getBalance();
        if (isMounted) setBalanceData(bal);

        // 2. Houses -> Active Owner -> Items + Debts
        const housesData = await apiService.getMyHouses();
        const activeOwner = housesData.active_owner_id;

        if (activeOwner) {
          const [chestRes, debtsRes] = await Promise.all([
            apiService.getChestItems(activeOwner).catch(() => ({ total_quantity: 0 })),
            apiService.getChestDebts(activeOwner).catch(() => []),
          ]);

          if (isMounted) {
            setItemsCount(chestRes.total_quantity || 0);
            setDebtsCount(Array.isArray(debtsRes) ? debtsRes.length : 0);
          }
        }
      } catch {
        // fallback silent handle
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadAll();
    return () => {
      isMounted = false;
    };
  }, []);

  /* ── 4 summary metrics array ── */
  const metrics = [
    {
      title: "Saldo Atual",
      value: balanceData ? `$ ${balanceData.balance.toLocaleString("pt-BR")}` : "$ 0",
      sub: "Saldo bancário disponível",
      icon: Coins,
      accent: "text-yellow-400",
      border: "border-yellow-500/20",
      iconBg: "bg-yellow-400/10",
    },
    {
      title: "Itens no Baú",
      value: itemsCount.toLocaleString("pt-BR"),
      sub: "Estoque da casa ativa",
      icon: Package,
      accent: "text-purple-400",
      border: "border-purple-500/20",
      iconBg: "bg-purple-400/10",
    },
    {
      title: "Débitos Pendentes",
      value: debtsCount.toString(),
      sub: debtsCount > 0 ? "Existem dívidas registradas" : "Nenhum débito pendente",
      icon: AlertTriangle,
      accent: debtsCount > 0 ? "text-red-400" : "text-gray-400",
      border: debtsCount > 0 ? "border-red-500/20" : "border-white/5",
      iconBg: debtsCount > 0 ? "bg-red-400/10" : "bg-white/5",
    },
    {
      title: "Movimentações Recentes",
      value: (balanceData?.history?.length || 0).toString(),
      sub: "Registros de conta bancária",
      icon: Activity,
      accent: "text-blue-400",
      border: "border-blue-500/20",
      iconBg: "bg-blue-400/10",
    },
  ];

  /* ── quick‑link cards data ── */
  const quickLinks = [
    {
      label: "Controle Financeiro",
      desc: "Gerencie seu saldo e transações",
      to: "/bank",
      icon: Coins,
      accent: "text-green-400",
      border: "hover:border-green-500/30",
      iconBg: "bg-green-400/10",
    },
    {
      label: "Gerenciar Baús",
      desc: "Veja itens e membros do baú",
      to: "/chests",
      icon: Package,
      accent: "text-purple-400",
      border: "hover:border-purple-500/30",
      iconBg: "bg-purple-400/10",
    },
    {
      label: "Painel Admin",
      desc: "Administração geral do sistema",
      to: "/admin",
      icon: ShieldAlert,
      accent: "text-red-400",
      border: "hover:border-red-500/30",
      iconBg: "bg-red-400/10",
    },
  ];

  return (
    <motion.div
      className="space-y-8"
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {/* ──── Header Banner ──── */}
      <motion.div
        variants={fadeUp}
        className="flex items-center justify-between flex-wrap gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl backdrop-blur-md"
      >
        <div className="flex items-center gap-3.5">
          {currentUser?.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="w-12 h-12 rounded-xl border border-white/10 shadow-md"
            />
          ) : (
            <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl">
              <LayoutDashboard className="w-6 h-6 text-purple-400" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">
              Olá, {currentUser?.username || "Jogador"}! 👋
            </h1>
            <p className="text-gray-400 text-xs mt-0.5">
              Visão geral do seu saldo, inventário de baú e movimentações da comunidade.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ──── 4 Metric Summary Cards ──── */}
      <motion.div
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <motion.div
              key={idx}
              variants={fadeUp}
              whileHover={{ y: -2 }}
              className={`p-5 rounded-2xl border ${m.border} bg-white/[0.01] backdrop-blur-md relative overflow-hidden group transition duration-200`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {m.title}
                </span>
                <div className={`p-2.5 rounded-xl ${m.iconBg} border border-white/5`}>
                  <Icon className={`w-5 h-5 ${m.accent}`} />
                </div>
              </div>

              {loading ? (
                <div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse mt-3" />
              ) : (
                <h2 className="text-2xl font-extrabold text-white mt-3 font-mono">
                  {m.value}
                </h2>
              )}

              <p className="text-[11px] text-gray-500 mt-1.5">{m.sub}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* ──── Lower Content: 2 Columns ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Recent Balance Timeline */}
        <motion.div
          variants={fadeUp}
          className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Atividade Recente
            </h3>
            <Link
              to="/bank"
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
            >
              Ver Extrato Completo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : balanceData?.history && balanceData.history.length > 0 ? (
            <div className="space-y-3">
              {balanceData.history
                .slice()
                .reverse()
                .slice(0, 5)
                .map((tx, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/5 bg-white/[0.005] hover:bg-white/[0.015] transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`p-2 rounded-lg border ${
                          tx.type === "add"
                            ? "bg-green-500/10 border-green-500/20 text-green-400"
                            : "bg-red-500/10 border-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.type === "add" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {tx.reason || (tx.type === "add" ? "Depósito" : "Saque")}
                        </p>
                        <span className="text-[10px] text-gray-500">
                          {new Date(tx.date).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-bold font-mono ${
                          tx.type === "add" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "add" ? "+" : "-"} $ {tx.amount.toLocaleString("pt-BR")}
                      </span>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Final: ${tx.balance_after.toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500 text-sm">
              Nenhuma movimentação bancária registrada ainda.
            </div>
          )}
        </motion.div>

        {/* Right Column (1 col): Quick Link Cards */}
        <motion.div variants={fadeUp} className="space-y-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">
            Atalhos Rápidos
          </h3>

          <div className="space-y-3">
            {quickLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link key={idx} to={link.to} className="block">
                  <motion.div
                    whileHover={{ scale: 1.015, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md ${link.border} transition duration-200 flex items-center justify-between group cursor-pointer`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`p-3 rounded-xl ${link.iconBg} border border-white/5 group-hover:scale-105 transition duration-200`}
                      >
                        <Icon className={`w-5 h-5 ${link.accent}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                          {link.label}
                        </h4>
                        <p className="text-xs text-gray-500">{link.desc}</p>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition duration-200" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
