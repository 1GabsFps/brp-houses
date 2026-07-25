import { History, RefreshCw } from "lucide-react";
import type { ChestLog } from "../../api";
import { motion } from "framer-motion";

interface Props {
  logs: ChestLog[];
  loadingLogs: boolean;
  selectedOwnerId: string | null;
  fetchLogs: (id: string) => void;
}

const variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function ChestLogs({ logs, loadingLogs, selectedOwnerId, fetchLogs }: Props) {
  return (
    <motion.div variants={variants} initial="hidden" animate="visible" exit="exit" className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-purple-400" /> Logs de Atividades Recentes
        </h3>
        <button
          onClick={() => selectedOwnerId && fetchLogs(selectedOwnerId)}
          className="p-2 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] text-gray-400 hover:text-white transition duration-200 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loadingLogs ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
        </div>
      ) : logs.length > 0 ? (
        <div className="relative pl-6 border-l border-white/5 space-y-8">
          {logs.map((log, idx) => {
            let actionIcon = "📦";
            let iconBg = "bg-purple-600/10 border-purple-500/20";
            
            if (log.action.includes("add")) {
              actionIcon = "➕";
              iconBg = "bg-green-600/10 border-green-500/20";
            } else if (log.action.includes("remove")) {
              actionIcon = "➖";
              iconBg = "bg-red-600/10 border-red-500/20";
            } else if (log.action.includes("member")) {
              actionIcon = "👥";
              iconBg = "bg-blue-600/10 border-blue-500/20";
            }

            return (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group"
              >
                <div className={`absolute -left-[37px] top-0.5 w-6 h-6 rounded-full ${iconBg} border flex items-center justify-center text-xs z-10 transition duration-150`}>
                  <span>{actionIcon}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-300">{log.username}</span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(log.created_at).toLocaleString("pt-BR", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">{log.details}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center text-gray-500">Nenhuma atividade recente registrada para este baú.</div>
      )}
    </motion.div>
  );
}
