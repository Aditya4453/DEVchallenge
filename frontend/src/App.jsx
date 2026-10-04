import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import HeroInput from './components/HeroInput';
import SummaryCards from './components/SummaryCards';
import CategoryChart from './components/CategoryChart';
import TransactionList from './components/TransactionList';
import ToastNotification from './components/ToastNotification';
import { parseExpense, fetchExpenses, deleteExpense } from './services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const CATEGORY_OPTIONS = [
  'All', 'Food & Dining', 'Shopping', 'Transport', 'Bills & Utilities',
  'Entertainment', 'Income', 'Other'
];
const TRANSACTIONS_STORAGE_KEY = 'expenseai_transactions';

function readStoredTransactions() {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read local transactions:', err);
    return [];
  }
}

function writeStoredTransactions(transactions) {
  try {
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to persist local transactions:', err);
  }
}

function isInMonth(transaction, month, year) {
  const date = new Date(transaction.date);
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

export default function App() {
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState(() => readStoredTransactions());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [isParsing, setIsParsing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const availableCategories = useMemo(() => (
    [...new Set([
      ...CATEGORY_OPTIONS,
      ...expenses.map((item) => item.category || 'Other')
    ])]
  ), [expenses]);

  const filteredExpenses = useMemo(() => {
    const filtered = selectedCategory === 'All'
      ? expenses
      : expenses.filter((item) => (item.category || 'Other') === selectedCategory);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'amount-high') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'amount-low') return Number(a.amount) - Number(b.amount);

      const dateDifference = new Date(b.date).getTime() - new Date(a.date).getTime();
      return sortBy === 'oldest' ? -dateDifference : dateDifference;
    });
  }, [expenses, selectedCategory, sortBy]);

  const filteredTotals = useMemo(() => {
    const totals = filteredExpenses.reduce((result, item) => {
      const amount = Number(item.amount);
      if (item.type === 'income') result.totalIncome += amount;
      else result.totalSpent += amount;
      return result;
    }, { totalSpent: 0, totalIncome: 0 });

    return { ...totals, netBalance: totals.totalIncome - totals.totalSpent };
  }, [filteredExpenses]);

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Fetch Expenses
  const loadExpenses = useCallback(async (month, year) => {
    const storedExpenses = readStoredTransactions();
    try {
      const res = await fetchExpenses(month, year);
      if (res.success) {
        const apiExpenses = res.data || [];
        const apiIds = new Set(apiExpenses.map((expense) => expense._id));
        const mergedExpenses = [
          ...storedExpenses.filter((expense) => !apiIds.has(expense._id)),
          ...apiExpenses
        ];
        writeStoredTransactions(mergedExpenses);
        setExpenses(mergedExpenses.filter((expense) => isInMonth(expense, month, year)));
      }
    } catch (err) {
      console.error('Error loading expenses:', err);
      setExpenses(storedExpenses.filter((expense) => isInMonth(expense, month, year)));
    }
  }, []);

  useEffect(() => {
    loadExpenses(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, loadExpenses]);

  // Handle Add Natural Language Expense
  const handleAddExpense = async (promptText) => {
    setIsParsing(true);
    try {
      const res = await parseExpense({
        text: promptText,
        month: selectedMonth,
        year: selectedYear
      });

      if (res.success) {
        const item = res.data;
        addToast(`Added: ${item.category} (₹${item.amount})`, 'success');
        
        // Refresh List
        const updatedRes = await fetchExpenses(selectedMonth, selectedYear);
        const updatedList = updatedRes.data || [];
        const storedExpenses = readStoredTransactions();
        const apiIds = new Set(updatedList.map((expense) => expense._id));
        const mergedExpenses = [
          ...storedExpenses.filter((expense) => !apiIds.has(expense._id)),
          ...updatedList
        ];
        writeStoredTransactions(mergedExpenses);
        setExpenses(mergedExpenses.filter((expense) => isInMonth(expense, selectedMonth, selectedYear)));

      }
    } catch (err) {
      console.error('Add expense error:', err);
      addToast(typeof err === 'string' ? err : 'Failed to parse expense', 'error');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id) => {
    try {
      const res = await deleteExpense(id);
      if (res.success) {
        addToast('Transaction removed', 'info');
        const remainingExpenses = readStoredTransactions().filter((expense) => expense._id !== id);
        writeStoredTransactions(remainingExpenses);
        loadExpenses(selectedMonth, selectedYear);
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      addToast('Failed to delete expense', 'error');
    }
  };

  const handleImport = (rows) => {
    const importedExpenses = rows.map((row, index) => ({
      ...row,
      _id: `import_${Date.now()}_${index}`,
      rawInput: 'Imported transaction',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    const mergedExpenses = [...readStoredTransactions(), ...importedExpenses];
    writeStoredTransactions(mergedExpenses);
    setExpenses(mergedExpenses.filter((expense) => isInMonth(expense, selectedMonth, selectedYear)));
    addToast(`Imported ${importedExpenses.length} transaction${importedExpenses.length === 1 ? '' : 's'}`, 'success');
  };

  return (
    <>
      {/* 1. Full-screen Loading Screen */}
      {isLoadingScreen && (
        <LoadingScreen onComplete={() => setIsLoadingScreen(false)} />
      )}

      {/* 2. Main Vercel Dark Dashboard */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {/* Subtle Grid Overlay */}
        <div className="fixed inset-0 bg-vercel-grid pointer-events-none opacity-40"></div>

        {/* Header Navigation */}
        <Header 
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onImport={handleImport}
          onImportError={(message) => addToast(message, 'error')}
        />

        {/* Hero Natural Language Prompt Section */}
        <HeroInput 
          onSubmit={handleAddExpense}
          isLoading={isParsing}
        />

        <section className="mb-8 flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Category</span>
            {availableCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === category
                    ? 'border-indigo-400/50 bg-indigo-500/20 text-indigo-200'
                    : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20 hover:text-neutral-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Sort
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs font-medium normal-case tracking-normal text-neutral-200 outline-none focus:border-indigo-400/50"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="amount-high">Amount: high to low</option>
              <option value="amount-low">Amount: low to high</option>
            </select>
          </label>
        </section>

        {/* Monthly Financial Summary Cards */}
        <SummaryCards 
          totalSpent={filteredTotals.totalSpent}
          totalIncome={filteredTotals.totalIncome}
          netBalance={filteredTotals.netBalance}
        />

        {/* Main Content Grid: Chart & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5">
            <CategoryChart 
              expenses={filteredExpenses}
              totalSpent={filteredTotals.totalSpent}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              monthName={MONTH_NAMES[selectedMonth - 1]}
              year={selectedYear}
            />
          </section>

          <section className="lg:col-span-7">
            <TransactionList 
              expenses={filteredExpenses}
              onDelete={handleDeleteExpense}
              monthName={MONTH_NAMES[selectedMonth - 1]}
              year={selectedYear}
              selectedCategory={selectedCategory}
              sortBy={sortBy}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-neutral-500 py-6 border-t border-white/10 font-sans">
          <p className="mb-1">Build for a Friend • <strong className="text-neutral-400">Hacktoberfest DEV Challenge</strong></p>
          <p className="text-neutral-600 font-mono text-[11px]">ExpenseAI — React, Framer Motion & Local AI</p>
        </footer>
      </div>

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} />
    </>
  );
}
