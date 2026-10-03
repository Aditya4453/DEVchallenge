import React, { useState, useEffect, useCallback } from 'react';
import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import HeroInput from './components/HeroInput';
import SummaryCards from './components/SummaryCards';
import CategoryChart from './components/CategoryChart';
import TransactionList from './components/TransactionList';
import ToastNotification from './components/ToastNotification';
import { 
  parseExpense, fetchExpenses, deleteExpense, playVoiceFeedback 
} from './services/api';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function App() {
  const [isLoadingScreen, setIsLoadingScreen] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('expenseai_voice_enabled') !== 'false';
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isSpeakingSummary, setIsSpeakingSummary] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast Helper
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  // Toggle Voice Audio
  const handleVoiceToggle = () => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('expenseai_voice_enabled', next);
      addToast(`Voice feedback ${next ? 'Enabled' : 'Muted'}`, 'info');
      return next;
    });
  };

  // Fetch Expenses
  const loadExpenses = useCallback(async (month, year) => {
    try {
      const res = await fetchExpenses(month, year);
      if (res.success) {
        setExpenses(res.data || []);
      }
    } catch (err) {
      console.error('Error loading expenses:', err);
      setExpenses([]);
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
        setExpenses(updatedList);

        // Calculate Totals for Audio Feedback
        let currentSpent = 0;
        updatedList.filter((e) => e.type === 'expense').forEach((e) => currentSpent += Number(e.amount));

        const monthName = MONTH_NAMES[selectedMonth - 1];
        const audioFeedback = item.type === 'income'
          ? `Received ${item.amount} rupees income from ${item.merchant}.`
          : `Added ${item.amount} rupees for ${item.merchant} under ${item.category}. Your total spending for ${monthName} is now ${currentSpent} rupees.`;

        playVoiceFeedback(audioFeedback, voiceEnabled);
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
        loadExpenses(selectedMonth, selectedYear);
      }
    } catch (err) {
      console.error('Delete expense error:', err);
      addToast('Failed to delete expense', 'error');
    }
  };

  // Handle ElevenLabs Listen Summary Audio Playback
  const handleListenSummary = () => {
    const monthName = MONTH_NAMES[selectedMonth - 1];

    if (expenses.length === 0) {
      const emptyMsg = `No transactions recorded for ${monthName} ${selectedYear}.`;
      addToast(emptyMsg, 'info');
      playVoiceFeedback(emptyMsg, voiceEnabled);
      return;
    }

    let totalSpent = 0;
    let totalIncome = 0;

    expenses.forEach((item) => {
      if (item.type === 'income') totalIncome += Number(item.amount);
      else totalSpent += Number(item.amount);
    });

    const netBalance = totalIncome - totalSpent;
    const reportText = `In ${monthName} ${selectedYear}, your total income was ${totalIncome} rupees and total spending was ${totalSpent} rupees across ${expenses.length} transactions. Your net balance is ${netBalance} rupees.`;

    setIsSpeakingSummary(true);
    addToast('Playing monthly audio summary', 'info');
    playVoiceFeedback(reportText, voiceEnabled);

    setTimeout(() => {
      setIsSpeakingSummary(false);
    }, 4500);
  };

  // Compute Totals
  let totalSpent = 0;
  let totalIncome = 0;
  expenses.forEach((item) => {
    if (item.type === 'income') totalIncome += Number(item.amount);
    else totalSpent += Number(item.amount);
  });
  const netBalance = totalIncome - totalSpent;

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
          voiceEnabled={voiceEnabled}
          onVoiceToggle={handleVoiceToggle}
        />

        {/* Hero Natural Language Prompt Section */}
        <HeroInput 
          onSubmit={handleAddExpense}
          isLoading={isParsing}
        />

        {/* Monthly Financial Summary Cards */}
        <SummaryCards 
          totalSpent={totalSpent}
          totalIncome={totalIncome}
          netBalance={netBalance}
        />

        {/* Main Content Grid: Chart & Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5">
            <CategoryChart 
              expenses={expenses}
              totalSpent={totalSpent}
              onListenSummary={handleListenSummary}
              isSpeaking={isSpeakingSummary}
            />
          </section>

          <section className="lg:col-span-7">
            <TransactionList 
              expenses={expenses}
              onDelete={handleDeleteExpense}
              monthName={MONTH_NAMES[selectedMonth - 1]}
              year={selectedYear}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-xs text-neutral-500 py-6 border-t border-white/10 font-sans">
          <p className="mb-1">Build for a Friend • <strong className="text-neutral-400">Hacktoberfest DEV Challenge</strong></p>
          <p className="text-neutral-600 font-mono text-[11px]">ExpenseAI — React, Framer Motion & ElevenLabs Voice</p>
        </footer>
      </div>

      {/* Toast Notification Container */}
      <ToastNotification toasts={toasts} />
    </>
  );
}
