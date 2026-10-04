import React, { useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { Download } from 'lucide-react';

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

export default function CategoryChart({
  expenses, totalSpent, selectedCategory, monthName, year
}) {
  const chartRef = useRef(null);
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

  const exportChart = (format) => {
    const chartCanvas = chartRef.current?.canvas;
    if (!chartCanvas) return;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 800;
    exportCanvas.height = 560 + labels.length * 28;
    const context = exportCanvas.getContext('2d');
    if (!context) return;

    context.fillStyle = '#111111';
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    context.lineWidth = 1;
    for (let x = 0; x < exportCanvas.width; x += 48) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, exportCanvas.height);
      context.stroke();
    }
    for (let y = 0; y < exportCanvas.height; y += 48) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(exportCanvas.width, y);
      context.stroke();
    }

    const chartSize = 470;
    context.drawImage(chartCanvas, (exportCanvas.width - chartSize) / 2, 24, chartSize, chartSize);
    context.textAlign = 'center';
    context.fillStyle = '#9ca3af';
    context.font = '600 16px Arial';
    context.fillText('SPENT', 400, 245);
    context.fillStyle = '#f5f5f5';
    context.font = '700 27px Arial';
    context.fillText(`₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 400, 278);
    context.textAlign = 'left';
    context.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    context.beginPath();
    context.moveTo(0, 500);
    context.lineTo(exportCanvas.width, 500);
    context.stroke();

    context.font = '600 20px Arial';
    labels.forEach((label, index) => {
      const y = 540 + index * 28;
      const amount = categoryTotals[label];
      const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
      context.fillStyle = backgroundColors[index];
      context.beginPath();
      context.arc(18, y - 6, 6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#f5f5f5';
      context.fillText(label, 34, y);
      context.fillStyle = '#9ca3af';
      context.textAlign = 'right';
      context.fillText(`${percentage}%`, 700, y);
      context.fillStyle = '#f5f5f5';
      context.fillText(`₹${amount.toLocaleString('en-IN')}`, 780, y);
      context.textAlign = 'left';
    });

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const link = document.createElement('a');
    const filenamePart = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    link.href = exportCanvas.toDataURL(mimeType, 0.95);
    link.download = `category-breakdown-${filenamePart(selectedCategory)}-${filenamePart(monthName)}-${year}.${format}`;
    link.click();
  };

  return (
    <div className="vercel-card p-6 rounded-xl border border-white/10 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-heading font-bold text-[#FCFBF9]">Category Breakdown</h3>
            <p className="text-xs text-neutral-400 font-sans">Monthly expense distributions</p>
          </div>
          <div className="flex items-center gap-1">
            <Download className="mr-1 h-3.5 w-3.5 text-neutral-500" />
            {['png', 'jpg'].map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => exportChart(format)}
                disabled={labels.length === 0}
                title={`Export chart as ${format.toUpperCase()}`}
                className="rounded border border-white/10 bg-white/5 px-1.5 py-1 text-[9px] font-semibold uppercase text-neutral-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        {/* DOUGHNUT CHART CONTAINER */}
        <div className="relative w-full max-w-[240px] mx-auto aspect-square my-4">
          <Doughnut ref={chartRef} data={chartData} options={chartOptions} />
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
