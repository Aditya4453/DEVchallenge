// ExpenseAI — ElevenLabs TTS & Frontend Client Logic

const API_BASE_URL = 'http://localhost:5000/api';

// Category Configuration & Colors
const CATEGORY_CONFIG = {
  'Food & Dining': { color: '#f43f5e', icon: 'utensils', badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
  'Shopping': { color: '#c084fc', icon: 'shopping-bag', badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20' },
  'Transport': { color: '#fbbf24', icon: 'car', badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
  'Bills & Utilities': { color: '#60a5fa', icon: 'zap', badgeBg: 'bg-blue-500/10 text-blue-300 border-blue-500/20' },
  'Entertainment': { color: '#f472b6', icon: 'film', badgeBg: 'bg-pink-500/10 text-pink-300 border-pink-500/20' },
  'Income': { color: '#34d399', icon: 'arrow-down-left', badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
  'Other': { color: '#9ca3af', icon: 'tag', badgeBg: 'bg-neutral-500/10 text-neutral-300 border-neutral-500/20' }
};

// Global App State
let state = {
  selectedMonth: new Date().getMonth() + 1, // 1 - 12
  selectedYear: new Date().getFullYear(),
  expenses: [],
  chartInstance: null,
  voiceEnabled: localStorage.getItem('expenseai_voice_enabled') !== 'false'
};

// DOM Elements
const monthSelect = document.getElementById('monthSelect');
const yearSelect = document.getElementById('yearSelect');
const expenseForm = document.getElementById('expenseForm');
const promptInput = document.getElementById('promptInput');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnIcon = document.getElementById('btnIcon');
const btnSpinner = document.getElementById('btnSpinner');

const voiceToggleBtn = document.getElementById('voiceToggleBtn');
const voiceToggleIcon = document.getElementById('voiceToggleIcon');
const voiceToggleText = document.getElementById('voiceToggleText');
const listenSummaryBtn = document.getElementById('listenSummaryBtn');
const listenSummaryText = document.getElementById('listenSummaryText');
const listenSummaryIcon = document.getElementById('listenSummaryIcon');

const totalSpentCard = document.getElementById('totalSpentCard');
const totalIncomeCard = document.getElementById('totalIncomeCard');
const netBalanceCard = document.getElementById('netBalanceCard');
const balanceStatusText = document.getElementById('balanceStatusText');

const transactionList = document.getElementById('transactionList');
const transactionCountBadge = document.getElementById('transactionCountBadge');
const chartCenterAmount = document.getElementById('chartCenterAmount');
const chartLegendList = document.getElementById('chartLegendList');
const toastContainer = document.getElementById('toastContainer');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initDropdowns();
  initChart();
  initVoiceControls();
  initEventListeners();
  checkBackendHealth();
  fetchExpenses();
});

// Setup Month & Year Selectors
function initDropdowns() {
  monthSelect.value = state.selectedMonth;
  yearSelect.value = state.selectedYear;

  monthSelect.addEventListener('change', (e) => {
    state.selectedMonth = parseInt(e.target.value);
    fetchExpenses();
  });

  yearSelect.addEventListener('change', (e) => {
    state.selectedYear = parseInt(e.target.value);
    fetchExpenses();
  });
}

// Voice Audio Controls Initialization
function initVoiceControls() {
  updateVoiceToggleUI();

  voiceToggleBtn.addEventListener('click', () => {
    state.voiceEnabled = !state.voiceEnabled;
    localStorage.setItem('expenseai_voice_enabled', state.voiceEnabled);
    updateVoiceToggleUI();
    showToast(`Voice feedback ${state.voiceEnabled ? 'Enabled' : 'Muted'}`, 'info');
  });

  listenSummaryBtn.addEventListener('click', () => {
    playMonthlyAudioSummary();
  });
}

function updateVoiceToggleUI() {
  if (state.voiceEnabled) {
    voiceToggleText.textContent = 'Voice ON';
    voiceToggleIcon.setAttribute('data-lucide', 'volume-2');
    voiceToggleBtn.className = 'flex items-center gap-2 bg-[#121212] border border-emerald-500/30 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-300 transition';
  } else {
    voiceToggleText.textContent = 'Voice OFF';
    voiceToggleIcon.setAttribute('data-lucide', 'volume-x');
    voiceToggleBtn.className = 'flex items-center gap-2 bg-[#121212] border border-white/10 px-3 py-2 rounded-lg text-xs font-semibold text-neutral-400 transition opacity-80';
  }
  if (window.lucide) lucide.createIcons();
}

// Speak Text via ElevenLabs TTS API (with Web Speech fallback)
async function speakAudio(text) {
  if (!state.voiceEnabled || !text) return;

  try {
    const res = await fetch(`${API_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    const contentType = res.headers.get('content-type');
    if (res.ok && contentType && contentType.includes('audio/mpeg')) {
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('ElevenLabs API audio playback notice:', err.message);
  }

  // Browser Native Web Speech API Fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Generate & Play Audio Summary for Monthly Transactions
function playMonthlyAudioSummary() {
  if (state.expenses.length === 0) {
    const emptyText = `No transactions recorded for ${monthSelect.options[monthSelect.selectedIndex].text} ${state.selectedYear}.`;
    speakAudio(emptyText);
    showToast(emptyText, 'info');
    return;
  }

  let totalSpent = 0;
  let totalIncome = 0;

  state.expenses.forEach(item => {
    if (item.type === 'income') totalIncome += Number(item.amount);
    else totalSpent += Number(item.amount);
  });

  const monthName = monthSelect.options[monthSelect.selectedIndex].text;
  const netBalance = totalIncome - totalSpent;

  const reportText = `In ${monthName} ${state.selectedYear}, your total income was ${totalIncome} rupees and total spending was ${totalSpent} rupees across ${state.expenses.length} transactions. Your net balance is ${netBalance} rupees.`;

  listenSummaryText.textContent = 'Speaking...';
  listenSummaryBtn.classList.add('animate-pulse');

  speakAudio(reportText);
  showToast('Playing monthly audio summary', 'info');

  setTimeout(() => {
    listenSummaryText.textContent = 'Listen Summary';
    listenSummaryBtn.classList.remove('animate-pulse');
  }, 4500);
}

// Event Listeners setup
function initEventListeners() {
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = promptInput.value.trim();
    if (!text) return;
    await submitExpense(text);
  });

  document.querySelectorAll('.sample-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const text = chip.textContent.trim().replace(/^[\u{1F300}-\u{1F9FF}]\s*/u, '');
      promptInput.value = text;
      promptInput.focus();
    });
  });
}

// Backend Health Verification
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    const data = await res.json();
    console.log('Backend connection active:', data);
  } catch (err) {
    console.warn('Backend API connection warning:', err.message);
  }
}

// Fetch Expenses for Selected Month & Year
async function fetchExpenses() {
  showLoadingSkeleton();
  try {
    const res = await fetch(`${API_BASE_URL}/expenses?month=${state.selectedMonth}&year=${state.selectedYear}`);
    const result = await res.json();

    if (result.success) {
      state.expenses = result.data || [];
      updateDashboardUI();
    } else {
      showToast('Failed to fetch monthly expenses', 'error');
    }
  } catch (err) {
    console.error('Error fetching expenses:', err);
    updateDashboardUI();
  }
}

// Submit Natural Language Expense
async function submitExpense(text) {
  setLoadingState(true);
  try {
    const res = await fetch(`${API_BASE_URL}/parse-expense`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        month: state.selectedMonth,
        year: state.selectedYear
      })
    });

    const result = await res.json();

    if (result.success) {
      promptInput.value = '';
      const item = result.data;
      showToast(`Added: ${item.category} (₹${item.amount})`, 'success');
      await fetchExpenses();

      // Calculate new total spent for audio confirmation
      let currentSpent = 0;
      state.expenses.filter(e => e.type === 'expense').forEach(e => currentSpent += Number(e.amount));

      const monthName = monthSelect.options[monthSelect.selectedIndex].text;
      const audioFeedback = item.type === 'income'
        ? `Received ${item.amount} rupees income from ${item.merchant}.`
        : `Added ${item.amount} rupees for ${item.merchant} under ${item.category}. Your total spending for ${monthName} is now ${currentSpent} rupees.`;

      speakAudio(audioFeedback);
    } else {
      showToast(result.error || 'Failed to parse expense', 'error');
    }
  } catch (err) {
    console.error('Error adding expense:', err);
    showToast('Failed to connect to backend server', 'error');
  } finally {
    setLoadingState(false);
  }
}

// Delete Expense
async function deleteExpense(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE'
    });
    const result = await res.json();

    if (result.success) {
      showToast('Transaction removed', 'info');
      await fetchExpenses();
    } else {
      showToast('Could not delete expense', 'error');
    }
  } catch (err) {
    console.error('Error deleting expense:', err);
    showToast('Failed to delete expense', 'error');
  }
}

// Update UI Components
function updateDashboardUI() {
  const expenses = state.expenses;

  let totalSpent = 0;
  let totalIncome = 0;

  expenses.forEach(item => {
    if (item.type === 'income') {
      totalIncome += Number(item.amount);
    } else {
      totalSpent += Number(item.amount);
    }
  });

  const netBalance = totalIncome - totalSpent;

  totalSpentCard.textContent = `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  totalIncomeCard.textContent = `₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  netBalanceCard.textContent = `${netBalance >= 0 ? '' : '-' }₹${Math.abs(netBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  if (netBalance >= 0) {
    netBalanceCard.className = 'text-3xl font-heading font-bold text-[#FCFBF9] tracking-tight mb-1';
    balanceStatusText.innerHTML = `<i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i> Healthy positive balance`;
    balanceStatusText.className = 'text-xs text-neutral-400 font-sans flex items-center gap-1';
  } else {
    netBalanceCard.className = 'text-3xl font-heading font-bold text-amber-300 tracking-tight mb-1';
    balanceStatusText.innerHTML = `<i data-lucide="alert-triangle" class="w-3.5 h-3.5 text-amber-400"></i> Monthly deficit warning`;
    balanceStatusText.className = 'text-xs text-amber-400/80 font-sans flex items-center gap-1';
  }

  renderTransactionList(expenses);
  updateChart(expenses, totalSpent);

  if (window.lucide) {
    lucide.createIcons();
  }
}

// Render Transaction List items
function renderTransactionList(expenses) {
  transactionCountBadge.textContent = `${expenses.length} ${expenses.length === 1 ? 'Entry' : 'Entries'}`;

  if (expenses.length === 0) {
    transactionList.innerHTML = `
      <div class="flex flex-col items-center justify-center py-12 text-center text-neutral-500 font-sans">
        <div class="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-3 border border-white/10">
          <i data-lucide="receipt" class="w-6 h-6 text-neutral-400"></i>
        </div>
        <p class="text-sm font-semibold text-neutral-300">No transactions recorded</p>
        <p class="text-xs text-neutral-500 max-w-xs mt-1">Use the prompt bar above to log financial items for ${monthSelect.options[monthSelect.selectedIndex].text} ${state.selectedYear}.</p>
      </div>
    `;
    return;
  }

  transactionList.innerHTML = expenses.map(item => {
    const config = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG['Other'];
    const isIncome = item.type === 'income';
    const dateFormatted = new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });

    return `
      <div class="group flex items-center justify-between p-3.5 rounded-lg bg-[#0A0A0A] hover:bg-[#141414] border border-white/10 hover:border-white/20 transition-all animate-fade-in font-sans">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded ${config.badgeBg} border flex items-center justify-center shrink-0">
            <i data-lucide="${isIncome ? 'arrow-down-left' : config.icon}" class="w-4 h-4"></i>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-semibold text-sm text-[#FCFBF9] font-sans">${escapeHtml(item.merchant || 'General')}</span>
              <span class="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.05em] rounded ${config.badgeBg} border">
                ${item.category}
              </span>
            </div>
            <p class="text-xs text-neutral-400 mt-0.5 line-clamp-1">
              "${escapeHtml(item.rawInput || '')}" • <span class="text-neutral-500">${dateFormatted}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="font-heading text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-[#FCFBF9]'}">
            ${isIncome ? '+' : '-'}₹${Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <button 
            onclick="deleteExpense('${item._id}')"
            title="Delete transaction" 
            class="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
          >
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Chart.js Setup & Update
function initChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  state.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0,
        hoverOffset: 4
      }]
    },
    options: {
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
            label: function(context) {
              return ` ${context.label}: ₹${context.raw.toLocaleString('en-IN')}`;
            }
          }
        }
      }
    }
  });
}

function updateChart(expenses, totalSpent) {
  chartCenterAmount.textContent = `₹${totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const categoryTotals = {};
  expenses.filter(e => e.type === 'expense').forEach(item => {
    const cat = item.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(item.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const backgroundColors = labels.map(l => (CATEGORY_CONFIG[l] || CATEGORY_CONFIG['Other']).color);

  state.chartInstance.data.labels = labels;
  state.chartInstance.data.datasets[0].data = data;
  state.chartInstance.data.datasets[0].backgroundColor = backgroundColors;
  state.chartInstance.update();

  if (labels.length === 0) {
    chartLegendList.innerHTML = `<p class="text-neutral-500 text-center py-2 text-xs font-sans">No expenses logged for breakdown</p>`;
    return;
  }

  chartLegendList.innerHTML = labels.map(cat => {
    const amount = categoryTotals[cat];
    const percentage = totalSpent > 0 ? ((amount / totalSpent) * 100).toFixed(1) : 0;
    const color = (CATEGORY_CONFIG[cat] || CATEGORY_CONFIG['Other']).color;

    return `
      <div class="flex items-center justify-between font-sans">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
          <span class="text-neutral-300 font-medium text-xs">${cat}</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-neutral-500 text-xs font-mono">${percentage}%</span>
          <span class="text-[#FCFBF9] font-heading text-xs font-bold">₹${amount.toLocaleString('en-IN')}</span>
        </div>
      </div>
    `;
  }).join('');
}

// UI State Control
function setLoadingState(isLoading) {
  submitBtn.disabled = isLoading;
  if (isLoading) {
    btnText.textContent = 'Parsing AI...';
    btnIcon.classList.add('hidden');
    btnSpinner.classList.remove('hidden');
  } else {
    btnText.textContent = 'Add Expense';
    btnIcon.classList.remove('hidden');
    btnSpinner.classList.add('hidden');
  }
}

function showLoadingSkeleton() {
  transactionList.innerHTML = Array(3).fill(0).map(() => `
    <div class="p-3.5 rounded-lg bg-[#0A0A0A] border border-white/5 animate-pulse flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded bg-white/5"></div>
        <div class="space-y-1.5">
          <div class="w-28 h-3 bg-white/10 rounded"></div>
          <div class="w-40 h-2 bg-white/5 rounded"></div>
        </div>
      </div>
      <div class="w-16 h-4 bg-white/10 rounded"></div>
    </div>
  `).join('');
}

// Toast Notifications
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const borderColors = {
    success: 'border-emerald-500/40 text-emerald-300',
    error: 'border-rose-500/40 text-rose-300',
    warning: 'border-amber-500/40 text-amber-300',
    info: 'border-white/20 text-[#FCFBF9]'
  };

  toast.className = `px-4 py-2.5 rounded-lg bg-[#121212] border ${borderColors[type] || borderColors.info} shadow-2xl text-xs font-medium flex items-center gap-2 animate-fade-in transition-all font-sans`;
  toast.innerHTML = `<span>${escapeHtml(message)}</span>`;

  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3000);
}

// Helper: Escape HTML string
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
