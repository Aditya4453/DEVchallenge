import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Volume2 } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const CATEGORY_CONFIG = {
  'Food & Dining': { color: '#f43f5e' },
  'Shopping': { color: '#c084fc' },
  'Transport': { color: '#fbbf24' },
  'Bills & Utilities': { color: '#60a5fa' },
  'Entertainment': { color: '#f472b6' },
  'Income': { color: '#34d399' },
  'Other': { color: '#9ca3af' }
};

export default function CategoryChart({ expenses, totalSpent, onListenSummary, isSpeaking }) {
  // Aggregate expenses by category
  const categoryTotals = {};
  expenses.filter(e => e.type === 'expense').forEach(item => {
    const cat = item.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
  });

  const labels = Object.keys(categoryTotals);
  const dataValues = Object.values(categoryTotals);
  const backgroundColors = labels.map(l => (CATEGORY_CONFIG[l] || CATEGORY_CONFIG['Other']).color);

  const chartData = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverOffset: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '78%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#121212',
        titleColor: '#FCFBF9',
        bodyColor: '#FCFBF9',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ₹${ctx.raw.toLocaleString('en-IN')}`
        }
      }
    }
  };

  return (
    <div className="vercel-card p-6 rounded-xl border border-white/10 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-[#FCFBF9]">Category Breakdown</h3>
            <p className="text-xs text-neutral-400 font-sans">Monthly expense distributions</p>
          </div>

          {/* LISTEN SUMMARY AUDIO BUTTON */}
          <button 
            type="button" 
            onClick={onListenSummary}
            title="Read Monthly Financial Summary with ElevenLabs Voice"
            className={`flex items-center gap-1.5 px-3 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold transition group ${
              isSpeaking ? 'animate-pulse' : ''
            }`}
          >
            <Volume2 className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition" />
            <span className="font-sans">{isSpeaking ? 'Speaking...' : 'Listen Summary'}</span>
          </button>
        </div>

        {/* DOUGHNUT CHART CONTAINER */}
        <div className="relative w-full max-w-[240px] mx-auto aspect-square my-4">
          <Doughnut data={chartData} options={chartOptions} />
          {/* Center Overlay Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] uppercase tracking-[0.05em] font-semibold text-neutral-400 font-sans">Spent</span>
            <span className="text-lg font-heading font-bold text-[#FCFBF9]">
              ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* DYNAMIC LEGEND LIST */}
      <div className="space-y-2.5 mt-4 pt-4 border-t border-white/10 text-xs font-sans">
        {labels.length === 0 ? (
          <p className="text-neutral-500 text-center py-2 text-xs font-sans">No expenses logged for breakdown</p>
        ) : (
          labels.map(cat => {
            const amount = categoryTotals[cat];
            const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
            const color = (CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other']).color;

            return (
              <div key={cat} className="flex items-center justify-between font-sans">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
                  <span className="text-neutral-300 font-medium text-xs">{cat}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-neutral-500 text-xs font-mono">{percentage}%</span>
                  <span className="text-[#FCFBF9] font-heading text-xs font-bold">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
