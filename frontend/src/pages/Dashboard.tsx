import React, { useEffect, useState } from "react";
import { apiService } from "../api";
import type { BalanceData } from "../api";
import { Coins, Plus, Minus, Search, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"add" | "remove">("add");
  const [submitting, setSubmitting] = useState(false);

  // Busca e Filtros
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "add" | "remove">("all");

  const fetchBalance = () => {
    setLoading(true);
    apiService
      .getBalance()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar dados financeiros.");
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (isNaN(val) || val <= 0) {
      return toast.error("Por favor, insira um valor válido maior que zero.");
    }

    setSubmitting(true);
    const finalAmount = type === "add" ? val : -val;

    apiService
      .updateBalance(finalAmount, reason)
      .then(() => {
        setAmount("");
        setReason("");
        fetchBalance();
        setSubmitting(false);
        toast.success("Saldo atualizado com sucesso!");
      })
      .catch(() => {
        toast.error("Erro ao atualizar o saldo.");
        setSubmitting(false);
      });
  };

  if (loading && !data) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  const filteredHistory = data?.history.filter((tx) => {
    const matchesSearch =
      tx.reason.toLowerCase().includes(search.toLowerCase()) ||
      tx.amount.toString().includes(search);
    const matchesType = filterType === "all" || tx.type === filterType;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Controle Financeiro</h1>
            <p className="text-gray-400 text-xs mt-0.5">Gerencie seu saldo bancário e registre movimentações de entrada e saída.</p>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md relative overflow-hidden group">
          <div className="absolute right-4 top-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <Coins className="w-6 h-6 text-yellow-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Saldo Atual</span>
          <h2 className="text-3xl font-extrabold text-white mt-2 font-mono">
            $ {data?.balance.toLocaleString("pt-BR")}
          </h2>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md relative overflow-hidden group">
          <div className="absolute right-4 top-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
            <ArrowUpRight className="w-6 h-6 text-green-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Acumulado (Ganhos)</span>
          <h2 className="text-3xl font-extrabold text-green-400 mt-2 font-mono">
            + $ {data?.earned.toLocaleString("pt-BR")}
          </h2>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md relative overflow-hidden group">
          <div className="absolute right-4 top-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <ArrowDownLeft className="w-6 h-6 text-red-400" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Gasto</span>
          <h2 className="text-3xl font-extrabold text-red-400 mt-2 font-mono">
            - $ {data?.spent.toLocaleString("pt-BR")}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário de Movimentação */}
        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4">
            Lançar Movimentação
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex rounded-xl bg-white/[0.02] p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setType("add")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  type === "add"
                    ? "bg-green-600 text-white shadow-md"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Plus className="w-4 h-4" /> Depósito
              </button>
              <button
                type="button"
                onClick={() => setType("remove")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
                  type === "remove"
                    ? "bg-red-600 text-white shadow-md"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                <Minus className="w-4 h-4" /> Saque
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="Ex: 500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motivo / Descrição</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white focus:outline-none focus:border-purple-500 transition"
                placeholder="Ex: Pagamento de rifa / Evento"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-3.5 rounded-xl font-bold transition shadow-lg cursor-pointer ${
                type === "add"
                  ? "bg-green-600 hover:bg-green-500 text-white shadow-green-600/10"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/10"
              } ${submitting ? "opacity-50 pointer-events-none" : ""}`}
            >
              {submitting ? "Lançando..." : "Confirmar Movimentação"}
            </button>
          </form>
        </div>

        {/* Tabela de Extrato */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h3 className="text-lg font-bold text-white">Extrato de Lançamentos</h3>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-[#12131a] border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition cursor-pointer"
              >
                <option value="all">Todas</option>
                <option value="add">Depósitos</option>
                <option value="remove">Saques</option>
              </select>

              <div className="relative w-full sm:w-48">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-purple-500 transition"
                  placeholder="Buscar..."
                />
              </div>
            </div>
          </div>

          {filteredHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                    <th className="pb-3">Data</th>
                    <th className="pb-3">Tipo</th>
                    <th className="pb-3">Motivo</th>
                    <th className="pb-3">Valor</th>
                    <th className="pb-3 text-right">Saldo Final</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.slice().reverse().map((tx, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.005] transition duration-150">
                      <td className="py-4 text-xs text-gray-400 font-mono">
                        {new Date(tx.date).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            tx.type === "add"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {tx.type === "add" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {tx.type === "add" ? "Depósito" : "Saque"}
                        </span>
                      </td>
                      <td className="py-4 text-gray-300 font-medium">{tx.reason}</td>
                      <td
                        className={`py-4 font-bold font-mono ${
                          tx.type === "add" ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {tx.type === "add" ? "+" : "-"} $ {tx.amount.toLocaleString("pt-BR")}
                      </td>
                      <td className="py-4 text-right font-semibold text-gray-400 font-mono">
                        $ {tx.balance_after.toLocaleString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500">Nenhuma movimentação registrada.</div>
          )}
        </div>
      </div>
    </div>
  );
}
