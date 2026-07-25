import axios from "axios";

const API_BASE_URL = 
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000/api"
    : "/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Adiciona o cabeçalho Authorization e X-Guild-Id a cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const guildId = localStorage.getItem("guild_id");
  if (guildId) {
    config.headers["X-Guild-Id"] = guildId;
  }
  return config;
});

export interface Guild {
  id: string;
  name: string;
  icon_url: string | null;
}

export interface User {
  id: string;
  username: string;
  avatar_url: string;
  guild_id: string;
  guilds: Guild[];
}

export interface BalanceData {
  balance: number;
  earned: number;
  spent: number;
  history: Array<{
    amount: number;
    type: "add" | "remove";
    balance_after: number;
    reason: string;
    date: string;
  }>;
}

export interface House {
  owner_id: string;
  owner_name: string;
  avatar_url: string;
}

export interface HousesData {
  active_owner_id: string | null;
  houses: House[];
}

export interface ChestItem {
  name: string;
  quantity: number;
  emoji: string;
  contributor_id: string;
  contributor_name: string;
}

export interface ChestData {
  items: ChestItem[];
  total_quantity: number;
}

export interface ChestMember {
  user_id: string;
  username: string;
  avatar_url: string;
  added_by_name: string;
  added_at: string;
}

export interface ChestDebt {
  debtor_id: string;
  debtor_name: string;
  creditor_id: string;
  creditor_name: string;
  item_name: string;
  emoji: string;
  quantity: number;
}

export interface ChestLog {
  action: string;
  details: string;
  created_at: string;
  user_id: string;
  username: string;
}

export interface AdminUser {
  user_id: string;
  username: string;
  balance: number;
  earned: number;
  spent: number;
}

export interface AdminChest {
  owner_id: string;
  owner_name: string;
  avatar_url: string;
  items: ChestItem[];
  total_items: number;
}

export interface ServerSettings {
  add_channel_id: string | null;
  remove_channel_id: string | null;
  log_channel_id: string | null;
  staff_role_id: string | null;
}

// Funções de API
export const apiService = {
  // Autenticação
  loginWithDiscord: async (code: string, redirectUri: string) => {
    const response = await api.post("/auth/login", { code, redirect_uri: redirectUri });
    return response.data;
  },

  loginTest: async (user_id: string, username: string, guild_id: string) => {
    const r = await api.post<{ token: string; user: User }>("/auth/test-login", {
      user_id,
      username,
      guild_id,
    });
    return r.data;
  },

  // Banco
  getBalance: async () => {
    const r = await api.get<BalanceData>("/bank/balance");
    return r.data;
  },

  updateBalance: async (amount: number, reason?: string) => {
    const r = await api.post("/bank/update", { amount, reason });
    return r.data;
  },

  // Admin Banco
  getAdminUsers: async () => {
    const r = await api.get<AdminUser[]>("/admin/bank/users");
    return r.data;
  },

  updateAdminUserBalance: async (targetUserId: string, amount: number, reason?: string) => {
    const r = await api.post(`/admin/bank/update`, { amount, reason }, {
      params: { target_user_id: targetUserId }
    });
    return r.data;
  },

  getAdminChests: async () => {
    const r = await api.get<AdminChest[]>("/admin/chests");
    return r.data;
  },

  // Baús / Casas
  getMyHouses: async () => {
    const r = await api.get<HousesData>("/chests/my-houses");
    return r.data;
  },

  setActiveHouse: async (houseOwnerId: string) => {
    const r = await api.post("/chests/active", { house_owner_id: houseOwnerId });
    return r.data;
  },

  getChestItems: async (ownerId: string) => {
    const r = await api.get<ChestData>(`/chests/${ownerId}/items`);
    return r.data;
  },

  addChestItem: async (ownerId: string, itemName: string, quantity: number) => {
    const r = await api.post(`/chests/${ownerId}/items/add`, {
      item_name: itemName,
      quantity,
    });
    return r.data;
  },

  removeChestItem: async (ownerId: string, itemName: string, quantity: number, targetContributorId?: string, generateDebt?: boolean) => {
    const r = await api.post(`/chests/${ownerId}/items/remove`, {
      item_name: itemName,
      quantity,
      target_contributor_id: targetContributorId,
      generate_debt: generateDebt,
    });
    return r.data;
  },

  // Membros do Baú
  getChestMembers: async (ownerId: string) => {
    const r = await api.get<ChestMember[]>(`/chests/${ownerId}/members`);
    return r.data;
  },

  addChestMember: async (ownerId: string, memberId: string) => {
    const r = await api.post(`/chests/${ownerId}/members/add`, {
      member_id: memberId,
    });
    return r.data;
  },

  removeChestMember: async (ownerId: string, memberId: string) => {
    const r = await api.post(`/chests/${ownerId}/members/remove`, {
      member_id: memberId,
    });
    return r.data;
  },

  getChestDebts: async (ownerId: string) => {
    const r = await api.get<ChestDebt[]>(`/chests/${ownerId}/debts`);
    return r.data;
  },

  getChestLogs: async (ownerId: string) => {
    const r = await api.get<ChestLog[]>(`/chests/${ownerId}/logs`);
    return r.data;
  },

  leaveHouse: async (ownerId: string) => {
    const r = await api.post(`/chests/${ownerId}/leave`);
    return r.data;
  },

  // Admin expandido
  checkIsStaff: async () => {
    const r = await api.get<{ is_staff: boolean }>("/admin/check");
    return r.data;
  },

  getAdminLogs: async (actionFilter?: string, search?: string) => {
    const params: any = { limit: 200 };
    if (actionFilter) params.action_filter = actionFilter;
    if (search) params.search = search;
    const r = await api.get<ChestLog[]>("/admin/logs", { params });
    return r.data;
  },

  getAdminSettings: async () => {
    const r = await api.get<ServerSettings>("/admin/settings");
    return r.data;
  },

  updateAdminSettings: async (settings: Partial<ServerSettings>) => {
    const payload: any = {};
    if (settings.add_channel_id !== undefined) payload.add_channel_id = settings.add_channel_id ? parseInt(settings.add_channel_id) : 0;
    if (settings.remove_channel_id !== undefined) payload.remove_channel_id = settings.remove_channel_id ? parseInt(settings.remove_channel_id) : 0;
    if (settings.log_channel_id !== undefined) payload.log_channel_id = settings.log_channel_id ? parseInt(settings.log_channel_id) : 0;
    if (settings.staff_role_id !== undefined) payload.staff_role_id = settings.staff_role_id ? parseInt(settings.staff_role_id) : 0;
    const r = await api.post("/admin/settings", payload);
    return r.data;
  },

  adminAddChestItem: async (ownerId: string, itemName: string, quantity: number, contributorId: string) => {
    const r = await api.post(`/admin/chests/${ownerId}/items/add`, {
      item_name: itemName,
      quantity,
      contributor_id: contributorId,
    });
    return r.data;
  },

  adminForgiveDebt: async (debtorId: string, creditorId: string, itemName: string) => {
    const r = await api.post("/admin/debts/forgive", {
      debtor_id: debtorId,
      creditor_id: creditorId,
      item_name: itemName,
    });
    return r.data;
  },
};
