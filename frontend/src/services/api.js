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
