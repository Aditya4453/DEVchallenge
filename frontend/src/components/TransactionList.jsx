import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Utensils, ShoppingBag, Car, Zap, Film, ArrowDownLeft, Tag, Trash2, Receipt 
} from 'lucide-react';
import { getCategoryBadgeStyle, getCategoryHex } from '../lib/categoryColors';

/** Icons for the standard known categories */
const CATEGORY_ICONS = {
  'Food & Dining':    Utensils,
  'Shopping':         ShoppingBag,
  'Transport':        Car,
  'Bills & Utilities':Zap,
  'Entertainment':    Film,
  'Income':           ArrowDownLeft,
  'Other':            Tag,
};

export default function TransactionList({ expenses, onDelete, monthName, year }) {
  return (
    <div className="vercel-card p-6 rounded-xl border border-white/10 flex flex-col h-full">
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-heading font-bold text-[#FCFBF9]">Monthly Transactions</h3>
          <p className="text-xs text-neutral-400 font-sans">Sorted newest first for selected month</p>
        </div>
        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.05em] text-neutral-300">
          {expenses.length} {expenses.length === 1 ? 'Entry' : 'Entries'}
        </span>
      </div>

      {/* TRANSACTION ITEMS CONTAINER */}
      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[440px] pr-1 custom-scrollbar">
        {expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-500 font-sans">
            <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-3 border border-white/10">
              <Receipt className="w-6 h-6 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-300">No transactions recorded</p>
            <p className="text-xs text-neutral-500 max-w-xs mt-1">
              Use the prompt bar above to log financial items for {monthName} {year}.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {expenses.map((item) => {
              const isIncome = item.type === 'income';
              const IconComponent = isIncome
                ? ArrowDownLeft
                : (CATEGORY_ICONS[item.category] || Tag);
              const badge = getCategoryBadgeStyle(item.category);
              const iconColor = getCategoryHex(item.category);
              const dateFormatted = new Date(item.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              });

              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  layout
                  className="group flex items-center justify-between p-3.5 rounded-lg bg-[#0A0A0A] hover:bg-[#141414] border border-white/10 hover:border-white/20 transition-all font-sans"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon box — uses inline style for unknown categories */}
                    <div
                      className={`w-9 h-9 rounded border flex items-center justify-center shrink-0 ${badge.className}`}
                      style={badge.style}
                    >
                      <IconComponent className="w-4 h-4" style={badge.style.color ? { color: iconColor } : {}} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[#FCFBF9] font-sans">
                          {item.merchant || 'General'}
                        </span>
                        {/* Category badge */}
                        <span
                          className={`px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] rounded ${badge.className}`}
                          style={badge.style}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                        "{item.rawInput || ''}" • <span className="text-neutral-500">{dateFormatted}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`font-heading text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-[#FCFBF9]'}`}>
                      {isIncome ? '+' : '-'}₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(item._id)}
                      title="Delete transaction"
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
