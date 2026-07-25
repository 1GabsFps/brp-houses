import { DollarSign, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { ChestDebt } from "../../api";
import { motion } from "framer-motion";

interface Props {
  debts: ChestDebt[];
  loadingDebts: boolean;
  currentUser: any;
}

const variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export default function ChestDebts({ debts, loadingDebts, currentUser }: Props) {
  const myDebts = debts.filter(d => d.debtor_id === currentUser?.id);
  const myCredits = debts.filter(d => d.creditor_id === currentUser?.id);
  const generalDebts = debts.filter(d => d.debtor_id !== currentUser?.id && d.creditor_id !== currentUser?.id);

  return (
    <motion.div variants={variants} initial="hidden" animate="visible" exit="exit" className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-md space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-purple-400" /> Balanços e Débitos
        </h3>
        <span className="text-xs text-gray-500">
          Retiradas de itens alheios geram dívidas mútuas.
        </span>
      </div>

      {loadingDebts ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4" /> Suas Dívidas
            </h4>
            {myDebts.length > 0 ? (
              <div className="space-y-3">
                {myDebts.map((d, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-red-500/10 bg-red-500/[0.01] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{d.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white capitalize">{d.item_name}</p>
                        <p className="text-xs text-gray-400">Deve para: <strong className="text-gray-300">{d.creditor_name}</strong></p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-red-400">{d.quantity} u.</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-500 bg-white/[0.005] rounded-xl border border-white/5">
                Nenhuma dívida pendente. 🎉
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Seus Créditos
            </h4>
            {myCredits.length > 0 ? (
              <div className="space-y-3">
                {myCredits.map((d, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-green-500/10 bg-green-500/[0.01] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{d.emoji}</span>
                      <div>
                        <p className="text-sm font-semibold text-white capitalize">{d.item_name}</p>
                        <p className="text-xs text-gray-400">Devedor: <strong className="text-gray-300">{d.debtor_name}</strong></p>
                      </div>
                    </div>
                    <span className="text-sm font-extrabold text-green-400">+{d.quantity} u.</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-gray-500 bg-white/[0.005] rounded-xl border border-white/5">
                Ninguém deve a você.
              </div>
            )}
          </div>

          {generalDebts.length > 0 && (
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outros Débitos Ativos na Casa</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {generalDebts.map((d, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-white/5 bg-white/[0.002] flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white capitalize flex items-center gap-1.5">
                        <span>{d.emoji}</span> {d.item_name}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        <strong className="text-gray-400">{d.debtor_name}</strong> deve para <strong className="text-gray-400">{d.creditor_name}</strong>
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-300">{d.quantity} u.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </motion.div>
  );
}
