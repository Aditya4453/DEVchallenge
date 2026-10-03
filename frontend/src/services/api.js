import axios from 'axios';

const API_BASE_URL = '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Send natural language text to backend Ollama parser
 */
export async function parseExpense({ text, month, year }) {
  try {
    const res = await client.post('/parse-expense', { text, month, year });
    return res.data;
  } catch (err) {
    console.error('API parseExpense error:', err);
    throw err.response?.data?.error || 'Failed to parse natural language expense.';
  }
}

/**
 * Fetch monthly transactions sorted newest first
 */
export async function fetchExpenses(month, year) {
  try {
    const res = await client.get(`/expenses?month=${month}&year=${year}`);
    return res.data;
  } catch (err) {
    console.error('API fetchExpenses error:', err);
    throw err.response?.data?.error || 'Failed to fetch expenses list.';
  }
}

/**
 * Delete a specific expense transaction by ID
 */
export async function deleteExpense(id) {
  try {
    const res = await client.delete(`/expenses/${id}`);
    return res.data;
  } catch (err) {
    console.error('API deleteExpense error:', err);
    throw err.response?.data?.error || 'Failed to delete transaction.';
  }
}

/**
 * ElevenLabs Text-to-Speech audio player with Web Speech fallback
 */
export async function playVoiceFeedback(text, voiceEnabled = true) {
  if (!voiceEnabled || !text) return;

  try {
    const res = await client.post('/text-to-speech', { text }, { responseType: 'arraybuffer' });
    const contentType = res.headers['content-type'];
    
    if (res.status === 200 && contentType && contentType.includes('audio/mpeg')) {
      const audioBlob = new Blob([res.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    }
  } catch (err) {
    console.warn('ElevenLabs API Audio notice, executing Web Speech fallback:', err.message);
  }

  // Web Speech API Native Browser Fallback
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}
