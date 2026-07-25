import { X } from "lucide-react";
import type { ChestItem } from "../../api";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  selectedItemForModal: ChestItem | null;
  setSelectedItemForModal: (item: ChestItem | null) => void;
  modalQty: string;
  setModalQty: (val: string) => void;
  modalGenerateDebt: boolean;
  setModalGenerateDebt: (val: boolean) => void;
  modalSubmitting: boolean;
  handleModalSubmit: (e: React.FormEvent) => void;
  currentUser: any;
}

export default function ChestModal({
  selectedItemForModal, setSelectedItemForModal,
  modalQty, setModalQty, modalGenerateDebt, setModalGenerateDebt,
  modalSubmitting, handleModalSubmit, currentUser
}: Props) {
  if (!selectedItemForModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md p-6 rounded-2xl border border-white/10 bg-[#0f1015] shadow-2xl space-y-5"
        >
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedItemForModal.emoji}</span>
              <div>
                <h3 className="text-base font-bold text-white capitalize">{selectedItemForModal.name}</h3>
                <p className="text-xs text-gray-400">
                  Dono: <strong className="text-gray-200">{selectedItemForModal.contributor_name}</strong>
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedItemForModal(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleModalSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs text-gray-300">
              <span>Disponível neste lote:</span>
              <strong className="text-sm font-bold text-white">{selectedItemForModal.quantity} u.</strong>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Quantidade a Retirar
              </label>
              <input
                type="number"
                required
                max={selectedItemForModal.quantity}
                min={1}
                value={modalQty}
                onChange={(e) => setModalQty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white focus:outline-none focus:border-purple-500 transition"
                placeholder={`Máximo: ${selectedItemForModal.quantity}`}
              />
            </div>

            {selectedItemForModal.contributor_id !== currentUser?.id && (
              <div className="flex items-center gap-2.5 py-1 select-none">
                <input
                  type="checkbox"
                  id="modalGenerateDebt"
                  checked={modalGenerateDebt}
                  onChange={(e) => setModalGenerateDebt(e.target.checked)}
                  className="w-4 h-4 rounded border-white/10 bg-white/[0.02] text-purple-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="modalGenerateDebt" className="text-xs text-gray-400 cursor-pointer">
                  Pegar emprestado (gerar débito)
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedItemForModal(null)}
                className="flex-1 py-3 rounded-xl font-bold border border-white/5 bg-white/[0.02] text-gray-400 hover:text-white transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={modalSubmitting}
                className={`flex-1 py-3 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition shadow-lg shadow-purple-600/10 cursor-pointer ${
                  modalSubmitting ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {modalSubmitting ? "Retirando..." : "Confirmar Saque"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
