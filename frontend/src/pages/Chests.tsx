import { useEffect, useState } from "react";
import { apiService } from "../api";
import type { ChestItem, ChestMember, ChestDebt, ChestLog, House } from "../api";
import ChestInventory from "../components/chest/ChestInventory";
import ChestDebts from "../components/chest/ChestDebts";
import ChestLogs from "../components/chest/ChestLogs";
import ChestModal from "../components/chest/ChestModal";
import { Package, DollarSign, History, LogOut } from "lucide-react";
import toast from "react-hot-toast";

const COMMON_ITEMS = [
  "diamante", "platina", "ouro", "prata", "cobre", "caixa de leite", "balde vazio",
  "papelao", "ferro", "pedra", "carvao", "anel de ouro", "colar de ouro",
  "brincos de ouro", "anel de prata", "colar de prata", "pulseira de cobre",
  "anel de cobre", "pingente de ferro", "anel de diamante", "colar de rubi", "anel de rubi"
];

export default function Chests() {
  const userRaw = localStorage.getItem("user");
  const currentUser = userRaw ? JSON.parse(userRaw) : null;

  const [activeTab, setActiveTab] = useState<"inventory" | "debts" | "logs">("inventory");
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);

  // Dados do Baú Selecionado
  const [chestItems, setChestItems] = useState<ChestItem[]>([]);
  const [totalQty, setTotalQty] = useState(0);
  const [members, setMembers] = useState<ChestMember[]>([]);
  const [debts, setDebts] = useState<ChestDebt[]>([]);
  const [logs, setLogs] = useState<ChestLog[]>([]);

  // Estados de Loading
  const [loadingHouses, setLoadingHouses] = useState(true);
  const [loadingChest, setLoadingChest] = useState(false);
  const [loadingDebts, setLoadingDebts] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Formulário de Lançamento Direto
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const [itemName, setItemName] = useState("");
  const [itemQty, setItemQty] = useState("");
  const [generalGenerateDebt, setGeneralGenerateDebt] = useState(true);
  const [itemSubmitting, setItemSubmitting] = useState(false);

  // Modal de Saque de Lote Específico
  const [selectedItemForModal, setSelectedItemForModal] = useState<ChestItem | null>(null);
  const [modalQty, setModalQty] = useState("");
  const [modalGenerateDebt, setModalGenerateDebt] = useState(true);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  // Formulário de Membros
  const [newMemberId, setNewMemberId] = useState("");
  const [memberSubmitting, setMemberSubmitting] = useState(false);

  useEffect(() => {
    apiService
      .getMyHouses()
      .then((res) => {
        setHouses(res.houses);
        if (res.active_owner_id) {
          setSelectedOwnerId(res.active_owner_id);
        } else if (res.houses.length > 0) {
          setSelectedOwnerId(res.houses[0].owner_id);
        }
        setLoadingHouses(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar lista de casas.");
        setLoadingHouses(false);
      });
  }, []);

  const reloadActiveData = (ownerId: string) => {
    setLoadingChest(true);
    apiService
      .getChestItems(ownerId)
      .then((res) => {
        setChestItems(res.items);
        setTotalQty(res.total_quantity);
        setLoadingChest(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar itens do baú.");
        setLoadingChest(false);
      });

    if (ownerId === currentUser?.id) {
      apiService
        .getChestMembers(ownerId)
        .then((res) => setMembers(res))
        .catch(() => {});
    } else {
      setMembers([]);
    }
  };

  const fetchDebts = (ownerId: string) => {
    setLoadingDebts(true);
    apiService
      .getChestDebts(ownerId)
      .then((res) => {
        setDebts(res);
        setLoadingDebts(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar balanços/débitos.");
        setLoadingDebts(false);
      });
  };

  const fetchLogs = (ownerId: string) => {
    setLoadingLogs(true);
    apiService
      .getChestLogs(ownerId)
      .then((res) => {
        setLogs(res);
        setLoadingLogs(false);
      })
      .catch(() => {
        toast.error("Erro ao carregar histórico de logs.");
        setLoadingLogs(false);
      });
  };

  useEffect(() => {
    if (selectedOwnerId) {
      reloadActiveData(selectedOwnerId);
      if (activeTab === "debts") fetchDebts(selectedOwnerId);
      if (activeTab === "logs") fetchLogs(selectedOwnerId);
    }
  }, [selectedOwnerId, activeTab]);

  const handleHouseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newOwnerId = e.target.value;
    setSelectedOwnerId(newOwnerId);
    apiService.setActiveHouse(newOwnerId).catch(() => {});
  };

  const handleItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId) return;
    const qty = Number(itemQty);
    if (!itemName.trim() || isNaN(qty) || qty <= 0) {
      return toast.error("Insira um nome e quantidade válidos.");
    }

    setItemSubmitting(true);
    if (actionType === "add") {
      apiService
        .addChestItem(selectedOwnerId, itemName, qty)
        .then(() => {
          setItemName("");
          setItemQty("");
          reloadActiveData(selectedOwnerId);
          setItemSubmitting(false);
          toast.success("Item adicionado com sucesso!");
        })
        .catch((err) => {
          toast.error(err.response?.data?.detail || "Erro ao adicionar item.");
          setItemSubmitting(false);
        });
    } else {
      apiService
        .removeChestItem(selectedOwnerId, itemName, qty, undefined, generalGenerateDebt)
        .then(() => {
          setItemName("");
          setItemQty("");
          reloadActiveData(selectedOwnerId);
          setItemSubmitting(false);
          toast.success("Item retirado com sucesso!");
        })
        .catch((err) => {
          toast.error(err.response?.data?.detail || "Erro ao retirar item.");
          setItemSubmitting(false);
        });
    }
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId || !selectedItemForModal) return;
    const qty = Number(modalQty);
    if (isNaN(qty) || qty <= 0 || qty > selectedItemForModal.quantity) {
      return toast.error("Insira uma quantidade válida.");
    }

    setModalSubmitting(true);
    apiService
      .removeChestItem(
        selectedOwnerId,
        selectedItemForModal.name,
        qty,
        selectedItemForModal.contributor_id,
        modalGenerateDebt
      )
      .then(() => {
        setSelectedItemForModal(null);
        setModalQty("");
        reloadActiveData(selectedOwnerId);
        setModalSubmitting(false);
        toast.success("Saque realizado com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao realizar saque.");
        setModalSubmitting(false);
      });
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId) return;
    if (!newMemberId.trim()) return toast.error("Insira o ID do membro.");

    setMemberSubmitting(true);
    apiService
      .addChestMember(selectedOwnerId, newMemberId.trim())
      .then(() => {
        setNewMemberId("");
        reloadActiveData(selectedOwnerId);
        setMemberSubmitting(false);
        toast.success("Membro adicionado com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao adicionar membro.");
        setMemberSubmitting(false);
      });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!selectedOwnerId) return;
    apiService
      .removeChestMember(selectedOwnerId, memberId)
      .then(() => {
        reloadActiveData(selectedOwnerId);
        toast.success("Membro removido com sucesso!");
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao remover membro.");
      });
  };

  const handleLeaveHouse = () => {
    if (!selectedOwnerId) return;
    if (!confirm("Tem certeza que deseja sair desta casa?")) return;

    apiService
      .leaveHouse(selectedOwnerId)
      .then(() => {
        toast.success("Você saiu da casa.");
        window.location.reload();
      })
      .catch((err) => {
        toast.error(err.response?.data?.detail || "Erro ao sair da casa.");
      });
  };

  if (loadingHouses) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
      </div>
    );
  }

  const isSelectedOwnerMe = selectedOwnerId === currentUser?.id;

  return (
    <div className="space-y-8">
      {/* Selector Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white/[0.01] border border-white/5 p-6 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-600/10 border border-purple-500/20 rounded-xl">
            <Package className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white leading-tight">Gerenciamento de Baús</h1>
            <p className="text-gray-400 text-xs mt-0.5">Alterne entre suas casas e controle os itens do seu estoque.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {houses.length > 0 && (
            <div className="flex items-center gap-2 flex-1 sm:flex-initial">
              <select
                value={selectedOwnerId || ""}
                onChange={handleHouseChange}
                className="w-full sm:w-64 bg-[#12131a] border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-purple-500 transition cursor-pointer font-medium"
              >
                {houses.map((h) => (
                  <option key={h.owner_id} value={h.owner_id}>
                    Casa de {h.owner_name} {h.owner_id === currentUser?.id ? "(Sua)" : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isSelectedOwnerMe && (
            <button
              onClick={handleLeaveHouse}
              className="p-3 rounded-xl border border-white/5 hover:border-red-500/30 hover:bg-red-500/5 hover:text-red-400 text-gray-400 transition duration-200 cursor-pointer"
              title="Sair desta casa"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex rounded-xl bg-white/[0.02] p-1 border border-white/5 max-w-md">
        <button
          onClick={() => setActiveTab("inventory")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "inventory"
              ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <Package className="w-4 h-4" /> Inventário
        </button>
        <button
          onClick={() => setActiveTab("debts")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "debts"
              ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Débitos
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition cursor-pointer ${
            activeTab === "logs"
              ? "bg-white/[0.04] text-white border border-white/5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          <History className="w-4 h-4" /> Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "inventory" && (
        <ChestInventory
          chestItems={chestItems}
          totalQty={totalQty}
          loadingChest={loadingChest}
          currentUser={currentUser}
          selectedOwnerId={selectedOwnerId}
          isSelectedOwnerMe={isSelectedOwnerMe}
          members={members}
          reloadActiveData={reloadActiveData}
          actionType={actionType}
          setActionType={setActionType}
          itemName={itemName}
          setItemName={setItemName}
          itemQty={itemQty}
          setItemQty={setItemQty}
          generalGenerateDebt={generalGenerateDebt}
          setGeneralGenerateDebt={setGeneralGenerateDebt}
          itemSubmitting={itemSubmitting}
          handleItemSubmit={handleItemSubmit}
          COMMON_ITEMS={COMMON_ITEMS}
          setSelectedItemForModal={setSelectedItemForModal}
          setModalQty={setModalQty}
          setModalGenerateDebt={setModalGenerateDebt}
          newMemberId={newMemberId}
          setNewMemberId={setNewMemberId}
          memberSubmitting={memberSubmitting}
          handleAddMember={handleAddMember}
          handleRemoveMember={handleRemoveMember}
        />
      )}

      {activeTab === "debts" && (
        <ChestDebts debts={debts} loadingDebts={loadingDebts} currentUser={currentUser} />
      )}

      {activeTab === "logs" && (
        <ChestLogs logs={logs} loadingLogs={loadingLogs} selectedOwnerId={selectedOwnerId} fetchLogs={fetchLogs} />
      )}

      {/* Modal de Saque de Lote Específico */}
      <ChestModal
        selectedItemForModal={selectedItemForModal}
        setSelectedItemForModal={setSelectedItemForModal}
        modalQty={modalQty}
        setModalQty={setModalQty}
        modalGenerateDebt={modalGenerateDebt}
        setModalGenerateDebt={setModalGenerateDebt}
        modalSubmitting={modalSubmitting}
        handleModalSubmit={handleModalSubmit}
        currentUser={currentUser}
      />
    </div>
  );
}
