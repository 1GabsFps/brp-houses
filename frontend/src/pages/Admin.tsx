import React, { useEffect, useState } from "react";
import { apiService } from "../api";
import type { AdminUser, AdminChest, ChestItem, ChestDebt, ChestLog, ServerSettings } from "../api";
import { ShieldAlert, Search, Edit3, Coins, Plus, Minus, Package, Eye, Trash2, Settings, History, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function Admin() {
  const [activeTab, setActiveTab] = useState<"bank" | "chests" | "logs" | "settings">("bank");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [chests, setChests] = useState<AdminChest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscador
  const [search, setSearch] = useState("");

  // Edição de Saldo
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"add" | "remove">("add");
  const [submitting, setSubmitting] = useState(false);

  // Visualização de Baú Administrado
  const [selectedChest, setSelectedChest] = useState<AdminChest | null>(null);
  const [selectedChestDebts, setSelectedChestDebts] = useState<ChestDebt[]>([]);
  const [removingItem, setRemovingItem] = useState<{ item: ChestItem; qty: string } | null>(null);
  const [chestSubmitting, setChestSubmitting] = useState(false);

  // Adição de Item por Admin
  const [showAddForm, setShowAddForm] = useState(false);
  const [addItemName, setAddItemName] = useState("");
  const [addItemQty, setAddItemQty] = useState("");
  const [addItemContributorId, setAddItemContributorId] = useState("");
  const [addItemSubmitting, setAddItemSubmitting] = useState(false);

  // Logs Globais
  const [globalLogs, setGlobalLogs] = useState<ChestLog[]>([]);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Configurações
  const [, setSettings] = useState<ServerSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [settingsSubmitting, setSettingsSubmitting] = useState(false);
  const [addCh, setAddCh] = useState("");
  const [removeCh, setRemoveCh] = useState("");
  const [logCh, setLogCh] = useState("");
  const [staffRole, setStaffRole] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    apiService
      .getAdminUsers()
      .then((res) => {
        setUsers(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Erro de permissão ou falha na API.");
        setLoading(false);
      });
  };

  const fetchChests = () => {
    setLoading(true);
    apiService
      .getAdminChests()
      .then((res) => {
        setChests(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.detail || "Erro de permissão ou falha na API.");
        setLoading(false);
      });
  };

  const fetchGlobalLogs = () => {
    setLoadingLogs(true);
    apiService
      .getAdminLogs(actionFilter || undefined, search || undefined)
      .then((res) => {
        setGlobalLogs(res);
        setLoadingLogs(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar logs globais.");
        setLoadingLogs(false);
      });
  };

  const fetchSettings = () => {
    setLoadingSettings(true);
    apiService
      .getAdminSettings()
      .then((res) => {
        setSettings(res);
        setAddCh(res.add_channel_id || "");
        setRemoveCh(res.remove_channel_id || "");
        setLogCh(res.log_channel_id || "");
        setStaffRole(res.staff_role_id || "");
        setLoadingSettings(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar configurações.");
        setLoadingSettings(false);
      });
  };

  useEffect(() => {
    setError(null);
    if (activeTab === "bank") {
      fetchUsers();
      setSelectedChest(null);
    } else if (activeTab === "chests") {
      fetchChests();
      setSelectedUser(null);
    } else if (activeTab === "logs") {
      fetchGlobalLogs();
    } else if (activeTab === "settings") {
      fetchSettings();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchGlobalLogs();
    }
  }, [actionFilter, search]);

  const handleAdminUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const val = Number(amount);
    if (isNaN(val) || val <= 0) return toast.error("Insira um valor válido.");

    setSubmitting(true);
    const delta = type === "add" ? val : -val;

    apiService
      .updateAdminUserBalance(selectedUser.user_id, delta, reason)
      .then(() => {
        setAmount("");
        setReason("");
        setSelectedUser(null);
        fetchUsers();
        setSubmitting(false);
        toast.success("Saldo atualizado com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao atualizar saldo.");
        setSubmitting(false);
      });
  };

  const loadChestDebts = (ownerId: string) => {
    apiService.getChestDebts(ownerId).then((res) => {
      setSelectedChestDebts(res);
    }).catch(() => {
      toast.error("Erro ao carregar dívidas do baú.");
    });
  };

  const handleRemoveChestItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChest || !removingItem) return;
    const qty = Number(removingItem.qty);
    if (isNaN(qty) || qty <= 0 || qty > removingItem.item.quantity) {
      return toast.error("Insira uma quantidade válida menor ou igual à disponível.");
    }

    setChestSubmitting(true);
    apiService
      .removeChestItem(selectedChest.owner_id, removingItem.item.name, qty)
      .then(() => {
        setRemovingItem(null);
        setChestSubmitting(false);
        apiService.getAdminChests().then((res) => {
          setChests(res);
          const updated = res.find((c) => c.owner_id === selectedChest.owner_id);
          setSelectedChest(updated || null);
          if (updated) {
            loadChestDebts(updated.owner_id);
          }
        });
        toast.success("Item removido com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao remover item.");
        setChestSubmitting(false);
      });
  };

  const handleAdminAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChest) return;
    const qty = Number(addItemQty);
    if (!addItemName.trim() || isNaN(qty) || qty <= 0) {
      return toast.error("Insira um nome e quantidade válidos.");
    }
    if (!addItemContributorId.trim()) {
      return toast.error("Insira o ID do colaborador.");
    }

    setAddItemSubmitting(true);
    apiService
      .adminAddChestItem(selectedChest.owner_id, addItemName, qty, addItemContributorId)
      .then(() => {
        setAddItemName("");
        setAddItemQty("");
        setShowAddForm(false);
        setAddItemSubmitting(false);
        apiService.getAdminChests().then((res) => {
          setChests(res);
          const updated = res.find((c) => c.owner_id === selectedChest.owner_id);
          setSelectedChest(updated || null);
          if (updated) {
            loadChestDebts(updated.owner_id);
          }
        });
        toast.success("Item adicionado com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao adicionar item.");
        setAddItemSubmitting(false);
      });
  };

  const handleForgiveDebt = (debt: ChestDebt) => {
    if (!confirm(`Tem certeza que deseja perdoar a dívida de ${debt.quantity}x ${debt.item_name} de ${debt.debtor_name} para ${debt.creditor_name}?`)) {
      return;
    }
    apiService
      .adminForgiveDebt(debt.debtor_id, debt.creditor_id, debt.item_name)
      .then(() => {
        if (selectedChest) {
          loadChestDebts(selectedChest.owner_id);
        }
        toast.success("Dívida perdoada com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao perdoar dívida.");
      });
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSubmitting(true);
    apiService
      .updateAdminSettings({
        add_channel_id: addCh || null,
        remove_channel_id: removeCh || null,
        log_channel_id: logCh || null,
        staff_role_id: staffRole || null,
      })
      .then(() => {
        toast.success("Configurações salvas com sucesso!");
        fetchSettings();
        setSettingsSubmitting(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao salvar configurações.");
        setSettingsSubmitting(false);
      });
  };

  const handleAuditSelect = (chest: AdminChest) => {
    setSelectedChest(chest);
    setRemovingItem(null);
    setShowAddForm(false);
    setAddItemContributorId(chest.owner_id); // Default to owner
    loadChestDebts(chest.owner_id);
  };

  if (loading && users.length === 0 && chests.length === 0 && !loadingLogs && !loadingSettings) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-red-500/20 border-t-red-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 max-w-md mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white">Acesso Negado</h2>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={() => (window.location.href = "/")}
          className="mt-4 px-6 py-2.5 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-white rounded-xl transition duration-200 cursor-pointer"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.user_id.includes(search)
  );

  const filteredChests = chests.filter((c) =>
    c.owner_name.toLowerCase().includes(search.toLowerCase()) ||
    c.owner_id.includes(search)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-red-500/5 border border-red-500/10 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Painel Administrativo (Staff)</h1>
            <p className="text-red-400/70 text-xs font-medium">Acesso de auditoria e edição global da economia e inventários do servidor.</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex rounded-xl bg-white/[0.02] p-1 border border-white/5 flex-wrap">
          <button
            onClick={() => {
              setActiveTab("bank");
              setSearch("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "bank"
                ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Coins className="w-4 h-4" /> Bancos
          </button>
          <button
            onClick={() => {
              setActiveTab("chests");
              setSearch("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "chests"
                ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Package className="w-4 h-4" /> Baús
          </button>
          <button
            onClick={() => {
              setActiveTab("logs");
              setSearch("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "logs"
                ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <History className="w-4 h-4" /> Logs
          </button>
          <button
            onClick={() => {
              setActiveTab("settings");
              setSearch("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Settings className="w-4 h-4" /> Configurações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CONTEÚDO PRINCIPAL - ABA BANCO */}
        {activeTab === "bank" && (
          <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-purple-400" /> Contas Bancárias
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-red-500 transition"
                  placeholder="Buscar usuário ou ID..."
                />
              </div>
            </div>

            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3">Usuário</th>
                      <th className="pb-3">Saldo</th>
                      <th className="pb-3">Ganhos</th>
                      <th className="pb-3">Gastos</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredUsers.map((u) => (
                      <tr key={u.user_id} className="hover:bg-white/[0.005] transition duration-150">
                        <td className="py-4">
                          <div>
                            <p className="font-semibold text-white">{u.username}</p>
                            <span className="text-[10px] text-gray-500">ID: {u.user_id}</span>
                          </div>
                        </td>
                        <td className="py-4 font-bold text-yellow-400">{u.balance}</td>
                        <td className="py-4 text-green-400">+{u.earned}</td>
                        <td className="py-4 text-red-400">-{u.spent}</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setAmount("");
                              setReason("");
                            }}
                            className="p-2 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-gray-400 rounded-lg transition duration-200 cursor-pointer"
                            title="Editar Saldo"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500">Nenhuma conta bancária corresponde à busca.</div>
            )}
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL - ABA BAÚS */}
        {activeTab === "chests" && (
          <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" /> Baús Cadastrados
              </h3>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-red-500 transition"
                  placeholder="Buscar dono ou ID..."
                />
              </div>
            </div>

            {filteredChests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="pb-3">Dono da Casa</th>
                      <th className="pb-3">ID do Dono</th>
                      <th className="pb-3">Total de Itens</th>
                      <th className="pb-3 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredChests.map((chest) => (
                      <tr key={chest.owner_id} className="hover:bg-white/[0.005] transition duration-150">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={chest.avatar_url}
                              alt={chest.owner_name}
                              className="w-8 h-8 rounded-lg border border-white/10"
                            />
                            <p className="font-semibold text-white">{chest.owner_name}</p>
                          </div>
                        </td>
                        <td className="py-4 text-gray-400 font-mono text-xs">{chest.owner_id}</td>
                        <td className="py-4 font-bold text-purple-400">{chest.total_items} unidades</td>
                        <td className="py-4 text-right">
                          <button
                            onClick={() => handleAuditSelect(chest)}
                            className="p-2 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-gray-400 rounded-lg transition duration-200 cursor-pointer"
                            title="Auditar Baú"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500">Nenhum baú cadastrado corresponde à busca.</div>
            )}
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL - ABA LOGS */}
        {activeTab === "logs" && (
          <div className="lg:col-span-3 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-red-400" />
                <h3 className="text-lg font-bold text-white">Auditoria de Logs Globais</h3>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="bg-[#12131a] border border-white/5 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500 transition cursor-pointer"
                >
                  <option value="">Todos os Tipos</option>
                  <option value="bank">Economia</option>
                  <option value="item">Itens de Baús</option>
                  <option value="member">Membros</option>
                  <option value="admin">Administração</option>
                </select>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-red-500 transition"
                    placeholder="Filtrar por texto..."
                  />
                </div>
              </div>
            </div>

            {loadingLogs ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-400 rounded-full animate-spin" />
              </div>
            ) : globalLogs.length > 0 ? (
              <div className="relative pl-6 border-l border-white/5 space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {globalLogs.map((log, idx) => {
                  let actionIcon = "⚙️";
                  let iconBg = "bg-white/[0.02] border-white/5 text-gray-400";
                  if (log.action.includes("bank")) {
                    actionIcon = "💰";
                    iconBg = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
                  } else if (log.action.includes("add")) {
                    actionIcon = "➕";
                    iconBg = "bg-green-500/10 border-green-500/20 text-green-400";
                  } else if (log.action.includes("remove")) {
                    actionIcon = "➖";
                    iconBg = "bg-red-500/10 border-red-500/20 text-red-400";
                  } else if (log.action.includes("member")) {
                    actionIcon = "👥";
                    iconBg = "bg-blue-500/10 border-blue-500/20 text-blue-400";
                  }

                  return (
                    <div key={idx} className="relative group">
                      <div className={`absolute -left-[37px] top-0.5 w-6 h-6 rounded-full ${iconBg} border flex items-center justify-center text-xs z-10`}>
                        {actionIcon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-300">{log.username}</span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(log.created_at).toLocaleString("pt-BR")}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">{log.details}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500">Nenhum log encontrado.</div>
            )}
          </div>
        )}

        {/* CONTEÚDO PRINCIPAL - ABA CONFIGURAÇÕES */}
        {activeTab === "settings" && (
          <div className="lg:col-span-3 p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
            <div className="border-b border-white/5 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-red-400" /> Configurações do Servidor
              </h3>
              <p className="text-gray-400 text-xs mt-1">Defina os IDs dos canais de controle e cargos administrativos do Discord.</p>
            </div>

            {loadingSettings ? (
              <div className="flex justify-center items-center py-16">
                <div className="w-8 h-8 border-4 border-red-500/20 border-t-red-400 rounded-full animate-spin" />
              </div>
            ) : (
              <form onSubmit={handleSettingsSubmit} className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID Canal Depósito Automático</label>
                    <input
                      type="text"
                      value={addCh}
                      onChange={(e) => setAddCh(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#12131a] text-white focus:outline-none focus:border-red-500 transition"
                      placeholder="Ex: 1298809208413618217"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID Canal Saque Automático</label>
                    <input
                      type="text"
                      value={removeCh}
                      onChange={(e) => setRemoveCh(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#12131a] text-white focus:outline-none focus:border-red-500 transition"
                      placeholder="Ex: 1298809208413618217"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID Canal Logs do Bot</label>
                    <input
                      type="text"
                      value={logCh}
                      onChange={(e) => setLogCh(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#12131a] text-white focus:outline-none focus:border-red-500 transition"
                      placeholder="Ex: 1298809208413618217"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ID Cargo Staff / Administrador</label>
                    <input
                      type="text"
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-white/5 bg-[#12131a] text-white focus:outline-none focus:border-red-500 transition"
                      placeholder="Ex: 1298809208413618217"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={settingsSubmitting}
                  className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition duration-200 shadow-lg shadow-red-600/10 cursor-pointer disabled:opacity-50"
                >
                  {settingsSubmitting ? "Salvando..." : "Salvar Configurações"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* BARRA LATERAL - FORMULÁRIO DE AÇÃO (BANCO E BAÚS) */}
        {activeTab !== "logs" && activeTab !== "settings" && (
          <div>
            {/* Formulário de Economia (Aba Banco) */}
            {activeTab === "bank" && (
              <>
                {selectedUser ? (
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">Editar Saldo</h3>
                      <p className="text-gray-400 text-xs mt-1">
                        Alterando saldo de <strong className="text-white">{selectedUser.username}</strong>
                      </p>
                    </div>

                    <form onSubmit={handleAdminUpdateSubmit} className="space-y-4">
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
                          <Plus className="w-4 h-4" /> Inserir
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
                          <Minus className="w-4 h-4" /> Retirar
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Valor</label>
                        <input
                          type="number"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white focus:outline-none focus:border-red-500 transition"
                          placeholder="Ex: 1000"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Motivo / Auditoria</label>
                        <textarea
                          required
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white focus:outline-none focus:border-red-500 transition min-h-[80px]"
                          placeholder="Ex: Ajuste por evento no servidor"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(null)}
                          className="flex-1 py-3 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-gray-300 rounded-xl transition duration-200 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={submitting}
                          className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition duration-200 shadow-lg shadow-red-600/10 cursor-pointer"
                        >
                          {submitting ? "Gravando..." : "Salvar"}
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md text-center py-16 text-gray-500 text-sm">
                    Selecione um usuário na tabela clicando no ícone de edição para alterar seu saldo.
                  </div>
                )}
              </>
            )}

            {/* Auditoria de Baú (Aba Baús) */}
            {activeTab === "chests" && (
              <>
                {selectedChest ? (
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white">Auditoria de Baú</h3>
                        <p className="text-gray-400 text-xs mt-1">
                          Baú de: <strong className="text-white">{selectedChest.owner_name}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition duration-150 cursor-pointer"
                      >
                        {showAddForm ? "Ver Itens" : "Adicionar Item"}
                      </button>
                    </div>

                    {showAddForm ? (
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-white">Adicionar Item ao Baú</h4>
                        <form onSubmit={handleAdminAddItemSubmit} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome do Item</label>
                            <input
                              type="text"
                              required
                              value={addItemName}
                              onChange={(e) => setAddItemName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-red-500 transition capitalize"
                              placeholder="Ex: ferro"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantidade</label>
                            <input
                              type="number"
                              required
                              value={addItemQty}
                              onChange={(e) => setAddItemQty(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-red-500 transition"
                              placeholder="Ex: 50"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID do Colaborador (Dono do Lote)</label>
                            <input
                              type="text"
                              required
                              value={addItemContributorId}
                              onChange={(e) => setAddItemContributorId(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-white/5 bg-white/[0.02] text-sm text-white focus:outline-none focus:border-red-500 transition"
                              placeholder="Discord User ID"
                            />
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => setShowAddForm(false)}
                              className="flex-1 py-2.5 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-gray-300 rounded-xl text-xs transition duration-200 cursor-pointer"
                            >
                              Voltar
                            </button>
                            <button
                              type="submit"
                              disabled={addItemSubmitting}
                              className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition duration-200 shadow-md shadow-purple-600/10 cursor-pointer disabled:opacity-50"
                            >
                              {addItemSubmitting ? "Gravando..." : "Confirmar"}
                            </button>
                          </div>
                        </form>
                      </div>
                    ) : (
                      <>
                        {/* Detalhamento de Itens */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens no Baú</h4>
                          {selectedChest.items.length > 0 ? (
                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {selectedChest.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl border border-white/5 bg-white/[0.005] flex items-center justify-between gap-3 hover:border-red-500/20 transition duration-150"
                                >
                                  <div className="flex items-center gap-2.5 overflow-hidden">
                                    <span className="text-2xl">{item.emoji}</span>
                                    <div className="overflow-hidden">
                                      <p className="text-sm font-semibold text-white capitalize truncate">{item.name}</p>
                                      <p className="text-[10px] text-gray-500 truncate">
                                        Qtd: <strong className="text-gray-300 font-bold">{item.quantity}</strong> | Colab: {item.contributor_name}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => setRemovingItem({ item, qty: "" })}
                                    className="p-1.5 border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-gray-400 rounded-lg transition duration-200 cursor-pointer"
                                    title="Remover Item"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-xs text-gray-500 bg-white/[0.002] border border-white/5 rounded-xl font-medium">Nenhum item cadastrado.</div>
                          )}
                        </div>

                        {/* Debitos / Dividas deste Baú */}
                        <div className="space-y-3 pt-3 border-t border-white/5">
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Débitos Ativos no Baú</h4>
                          {selectedChestDebts.length > 0 ? (
                            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                              {selectedChestDebts.map((debt, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl border border-white/5 bg-white/[0.005] flex items-center justify-between gap-3"
                                >
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="text-xl">{debt.emoji}</span>
                                    <div className="overflow-hidden leading-tight">
                                      <p className="text-xs font-bold text-white capitalize truncate">
                                        {debt.quantity}x {debt.item_name}
                                      </p>
                                      <p className="text-[9px] text-gray-500 truncate">
                                        {debt.debtor_name} &rarr; {debt.creditor_name}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleForgiveDebt(debt)}
                                    className="p-1 border border-white/5 hover:border-green-500/30 hover:bg-green-500/5 hover:text-green-400 text-gray-400 rounded-lg transition duration-200 cursor-pointer"
                                    title="Perdoar Dívida"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-xs text-gray-500 bg-white/[0.002] border border-white/5 rounded-xl font-medium">Sem débitos ativos neste baú.</div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Form de Remoção de Item Selecionado */}
                    {removingItem && (
                      <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-4">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5 capitalize">
                            Remover: {removingItem.item.emoji} {removingItem.item.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Disponível: <strong className="text-white">{removingItem.item.quantity}</strong> | Colaborador: {removingItem.item.contributor_name}
                          </p>
                        </div>

                        <form onSubmit={handleRemoveChestItemSubmit} className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantidade a Remover</label>
                            <input
                              type="number"
                              required
                              min={1}
                              max={removingItem.item.quantity}
                              value={removingItem.qty}
                              onChange={(e) => setRemovingItem({ ...removingItem, qty: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-white/5 bg-[#12131a] text-sm text-white focus:outline-none focus:border-red-500 transition"
                              placeholder={`Max: ${removingItem.item.quantity}`}
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setRemovingItem(null)}
                              className="flex-1 py-2 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] text-gray-300 rounded-xl text-xs transition duration-200 cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={chestSubmitting}
                              className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs transition duration-200 shadow-md shadow-red-600/10 cursor-pointer disabled:opacity-50"
                            >
                              {chestSubmitting ? "Removendo..." : "Confirmar"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md text-center py-16 text-gray-500 text-sm">
                    Selecione um baú na tabela clicando no ícone de olho para auditar e remover itens.
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
