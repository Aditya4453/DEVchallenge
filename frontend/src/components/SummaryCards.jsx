import React from 'react';
import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, Wallet, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function SummaryCards({ totalSpent, totalIncome, netBalance }) {
  const formattedSpent = `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formattedIncome = `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const formattedBalance = `${netBalance >= 0 ? '' : '-' }₹${Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      {/* CARD 1: TOTAL SPENT */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="vercel-card p-6 rounded-xl border border-white/10 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-neutral-400 font-sans">Total Monthly Spent</span>
          <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-rose-400">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-heading font-bold tracking-tight text-[#FCFBF9] mb-1 font-mono truncate min-w-0">
          {formattedSpent}
        </div>
        <p className="text-xs text-neutral-500 font-sans">Filtered for selected month</p>
      </motion.div>

      {/* CARD 2: TOTAL INCOME */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="vercel-card p-6 rounded-xl border border-white/10 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-neutral-400 font-sans">Total Monthly Income</span>
          <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl lg:text-3xl font-heading font-bold tracking-tight text-[#FCFBF9] mb-1 font-mono truncate min-w-0">
          {formattedIncome}
        </div>
        <p className="text-xs text-neutral-500 font-sans">Salary & secondary earnings</p>
      </motion.div>

      {/* CARD 3: NET SAVINGS / BALANCE */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="vercel-card p-6 rounded-xl border border-white/10 relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-neutral-400 font-sans">Net Savings / Balance</span>
          <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-neutral-200">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl lg:text-3xl font-heading font-bold tracking-tight mb-1 font-mono truncate min-w-0 ${netBalance >= 0 ? 'text-[#FCFBF9]' : 'text-amber-300'}`}>
          {formattedBalance}
        </div>
        <p className={`text-xs font-sans flex items-center gap-1 ${netBalance >= 0 ? 'text-neutral-400' : 'text-amber-400/80'}`}>
          {netBalance >= 0 ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Healthy positive balance
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Monthly deficit warning
            </>
          )}
        </p>
      </motion.div>
    </section>
  );
}
