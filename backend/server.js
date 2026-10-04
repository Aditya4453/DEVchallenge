const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files (compiled dist or fallback)
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const frontendPath = path.join(__dirname, '../frontend');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
} else {
  app.use(express.static(frontendPath));
}

const PORT = process.env.PORT || 5000;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma2:2b';
let inMemoryExpenses = [];

// Heuristic Fallback Parser for local offline execution when Ollama is unavailable
function fallbackParseTransaction(text) {
  const cleanText = text.trim();
  const lowerText = cleanText.toLowerCase();

  // Extract amount using regex
  const amountMatch = cleanText.match(/(?:rs\.?|inr|\$|₹)?\s*(\d+(?:\.\d{1,2})?)/i) || cleanText.match(/(\d+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 100;

  // Determine Type (income vs expense)
  const isIncome = /(salary|earned|received|got|credited|bonus|freelance|cashback|refund)/i.test(lowerText);
  const type = isIncome ? 'income' : 'expense';

  // Determine Category
  let category = 'Other';
  if (isIncome) {
    category = 'Income';
  } else if (/(coffee|tea|ccd|starbucks|cafe|restaurant|swiggy|zomato|food|dinner|lunch|pizza|burger|chai|spent kiye|khaya)/i.test(lowerText)) {
    category = 'Food & Dining';
  } else if (/(uber|ola|cab|auto|bus|metro|petrol|fuel|diesel|train|flight|rapido|taxi)/i.test(lowerText)) {
    category = 'Transport';
  } else if (/(amazon|flipkart|myntra|clothes|shoes|shopping|mall|bought|purchased)/i.test(lowerText)) {
    category = 'Shopping';
  } else if (/(bill|electricity|rent|wifi|recharge|water|gas|maintenance|subscription)/i.test(lowerText)) {
    category = 'Bills & Utilities';
  } else if (/(movie|netflix|spotify|game|cinema|concert|party|club)/i.test(lowerText)) {
    category = 'Entertainment';
  }

  // Determine Merchant Name
  let merchant = 'General';
  const words = cleanText.split(/\s+/);
  const knownMerchants = ['ccd', 'starbucks', 'uber', 'ola', 'swiggy', 'zomato', 'amazon', 'flipkart', 'myntra', 'netflix', 'spotify', 'd-mart', 'reliance'];
  for (const word of words) {
    if (knownMerchants.includes(word.toLowerCase())) {
      merchant = word.toUpperCase();
      break;
    }
  }

  if (merchant === 'General') {
    // Try to take non-numeric word capitalized
    const potential = words.find(w => w.length > 2 && !/^\d+$/.test(w) && !['aaj', 'pe', 'me', 'spent', 'got', 'for', 'the', 'kiya', 'liye'].includes(w.toLowerCase()));
    if (potential) merchant = potential.charAt(0).toUpperCase() + potential.slice(1);
  }

  return { amount, category, merchant, type };
}

// AI Parsing logic using Ollama gemma2:2b

async function parseWithOllama(text) {
  // 1. Enforce exact schema structure and keys
  const jsonSchema = {
    type: "object",
    properties: {
      amount: { type: "number" },
      category: { 
        type: "string",
        enum: [
          "Food & Dining", 
          "Shopping", 
          "Transport", 
          "Bills & Utilities", 
          "Entertainment", 
          "Health & Wellness", 
          "Income", 
          "Other"
        ]
      },
      merchant: { type: "string" },
      type: { type: "string", enum: ["expense", "income"] }
    },
    required: ["amount", "category", "merchant", "type"]
  };

  // 2. Strict system prompt with INR conversion context
  const systemPrompt = `You are an Indian financial expense parser.
Extract transaction details from the user input into JSON format.

USER INPUT: "${text}"

NUMBER CONVERSION RULES:
- Context is Indian Rupees (INR).
- "four fifty" -> 450 (NOT 4.50 or 45)
- "four hundred fifty" -> 450
- "fifteen hundred" -> 1500
- "two thousand" -> 2000

CATEGORY CLASSIFICATION RULES:
- Food & Dining: coffee, tea, restaurant, snacks, Zomato, Swiggy, CCD, McDonald's
- Shopping: clothes, shoes, Amazon, Flipkart, electronics, groceries
- Transport: Uber, Ola, cab, petrol, fuel, parking, metro, auto, bike
- Bills & Utilities: electricity, wifi, recharge, rent, water, mobile bill
- Entertainment: movies, games, concert, Netflix, BookMyShow
- Health & Wellness: medicines, doctor, gym, hospital
- Income: salary, stipend, cashback, refund, freelance payment
- Other: ONLY if the input is completely non-financial or unrecognizable.

If merchant is not explicitly mentioned, infer it from the item (e.g. "coffee", "cab", "bike").`;

  try {
    const response = await fetch(`${process.env.OLLAMA_HOST || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.2',
        prompt: systemPrompt,
        format: jsonSchema, // ENFORCES STRICT KEYS AT SAMPLER LEVEL
        stream: false,
        options: {
          temperature: 0 // Eliminates randomness
        }
      }),
      signal: AbortSignal.timeout(30000) // 30s timeout for cold starts
    });

    const data = await response.json();
    const rawParsed = JSON.parse(data.response.trim());

    // 3. Type sanitization to guarantee valid numbers
    const numAmount = Number(rawParsed.amount);
    
    return {
      amount: !isNaN(numAmount) && numAmount > 0 ? numAmount : 0,
      category: rawParsed.category || "Other",
      merchant: rawParsed.merchant || "General",
      type: rawParsed.type === "income" ? "income" : "expense"
    };

  } catch (err) {
    console.warn('Ollama local parsing failed or timed out, running heuristic fallback:', err.message);
    return fallbackHeuristicParser(text);
  }
}

// ------------------- ROUTES -------------------

// POST /api/parse-expense
app.post('/api/parse-expense', async (req, res) => {
  try {
    const { text, month, year } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text prompt is required.' });
    }

    // Call Ollama or Fallback Parser
    const parsedData = await parseWithOllama(text);

    // Build Date object based on provided month & year
    let transactionDate = new Date();
    if (month && year) {
      const targetMonth = parseInt(month) - 1; // 0-indexed
      const targetYear = parseInt(year);
      const now = new Date();
      if (now.getMonth() === targetMonth && now.getFullYear() === targetYear) {
        transactionDate = now;
      } else {
        // Set date to 15th of requested month/year
        transactionDate = new Date(targetYear, targetMonth, 15, 12, 0, 0);
      }
    }

    const newExpensePayload = {
      amount: parsedData.amount,
      category: parsedData.category,
      merchant: parsedData.merchant,
      type: parsedData.type,
      rawInput: text,
      date: transactionDate
    };

    const localExpense = {
      _id: 'local_' + Date.now(),
      ...newExpensePayload,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryExpenses.unshift(localExpense);
    return res.status(201).json({ success: true, data: localExpense });
  } catch (err) {
    console.error('Error parsing expense:', err);
    res.status(500).json({ success: false, error: 'Failed to process expense input.' });
  }
});

// GET /api/expenses?month=MM&year=YYYY
app.get('/api/expenses', async (req, res) => {
  try {
    const { month, year } = req.query;
    const expenses = [...inMemoryExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    return res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve expenses.' });
  }
});

// DELETE /api/expenses/:id
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const originalLength = inMemoryExpenses.length;
    inMemoryExpenses = inMemoryExpenses.filter((expense) => expense._id !== id);
    if (inMemoryExpenses.length === originalLength) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }
    return res.json({ success: true, message: 'Expense deleted successfully.' });
  } catch (err) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ success: false, error: 'Failed to delete expense.' });
  }
});

// POST /api/text-to-speech (ElevenLabs TTS Integration)
app.post('/api/text-to-speech', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ success: false, error: 'Text prompt is required.' });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const targetVoiceId = voiceId || process.env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb';

    if (!apiKey) {
      console.warn('[ElevenLabs TTS] Notice: ELEVENLABS_API_KEY not configured. Returning fallback response.');
      return res.status(200).json({
        success: false,
        fallback: true,
        message: 'ELEVENLABS_API_KEY is not set. Frontend will use Web Speech API fallback.'
      });
    }

    // ElevenLabs Direct API Audio Request
    const response = await axios({
      method: 'post',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${targetVoiceId}`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      data: {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: 'arraybuffer',
      timeout: 10000
    });

    res.setHeader('Content-Type', 'audio/mpeg');
    return res.send(Buffer.from(response.data));
  } catch (err) {
    console.warn(`[ElevenLabs TTS] Query failed (${err.message}). Responding with fallback.`);
    return res.status(200).json({
      success: false,
      fallback: true,
      error: err.message,
      message: 'ElevenLabs API call failed. Frontend will use Web Speech API fallback.'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    ollamaHost: OLLAMA_HOST,
    ollamaModel: OLLAMA_MODEL
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ExpenseAI Backend Server running on http://localhost:${PORT}`);
});
