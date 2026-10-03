# 📐 ExpenseAI Workflow & Architecture Documentation

ExpenseAI is an open-source, monthly personal finance assistant engineered for zero friction, complete data privacy, intuitive data visualization, and ElevenLabs voice audio feedback.

---

## 🔄 End-to-End Data Pipeline Flow

```
+------------------+         +------------------+         +----------------------+
|  User Natural    |         |  Express Backend |         |  Ollama Local Engine |
|  Language Input  | ------> |  POST API Router | ------> |  Model: gemma2:2b    |
| (e.g. "450 coffee")        | /api/parse-expense|        | (Strict JSON Prompt) |
+------------------+         +------------------+         +----------------------+
                                                                     |
                                                                     v
+------------------+         +------------------+         +----------------------+
| Monthly Dashboard|         |  MongoDB Atlas   |         | Strict JSON Parser   |
| Card & Chart.js  | <------ |  Cluster Store   | <------ | & Validation Layer   |
| View Updates     |         |  Expense Model   |         | (Amount, Category...) |
+------------------+         +------------------+         +----------------------+
         |
         v
+--------------------------------------------------------------------------------+
|                   🔊 ELEVENLABS TTS VOICE AUDIO PIPELINE                       |
| Parsed Expense -> Audio Text Generator -> ElevenLabs API -> MP3 Stream -> Play |
+--------------------------------------------------------------------------------+
```

### Pipeline Steps:
1. **User Natural Language Input:**
   The user enters a phrase in English or Hinglish (e.g., *"aaj 450 CCD coffee pe spent kiye"* or *"got 25000 salary"*).
2. **Express API Dispatch:**
   The client posts payload `{ text: "...", month: 10, year: 2026 }` to `/api/parse-expense`.
3. **Local LLM Query (Ollama / Gemma 2 2B):**
   Express constructs a strict system prompt instructing Ollama (`gemma2:2b`) to parse entity details into structured JSON.
4. **Validation & Persistence:**
   Backend validates input fields, attaches target date, creates Mongoose document in MongoDB Atlas, and returns saved record.
5. **Dynamic Dashboard & ElevenLabs Voice Feedback:**
   - Frontend updates summary cards, Chart.js doughnut chart, and transaction list.
   - Generates verbal confirmation string (e.g., *"Added 450 rupees for CCD under Food & Dining. Total spending is now 2,100 rupees."*).
   - Dispatches text payload to `POST /api/text-to-speech` for ElevenLabs TTS generation and streams MP3 audio to browser speakers.

---

## 🔊 ElevenLabs Text-to-Speech Integration

ExpenseAI fulfills the **"Best Use of ElevenLabs" Hacktoberfest DEV Challenge** category:
- **Model Used:** `eleven_multilingual_v2`
- **Audio Output:** Streamed `audio/mpeg` MP3 buffer.
- **Voice Features:**
  - Auto-speak audio confirmation upon logging an expense or income entry.
  - "Listen Summary" button for reading monthly financial statistics aloud.
  - Mute / Unmute audio toggle with `localStorage` persistence.
  - Built-in Web Speech API browser fallback when API key is not yet set.

---

## 🔌 API Specifications

### 1. `POST /api/parse-expense`
Parses natural language transaction text and saves entry.

### 2. `POST /api/text-to-speech`
Converts text payload into MP3 audio via ElevenLabs API.

- **Request Body:**
  ```json
  {
    "text": "Added 450 rupees for CCD under Food & Dining.",
    "voiceId": "JBFqnCBsd6RMkjVDRZzb"
  }
  ```
- **Response `200 OK`:** Streamed binary audio `audio/mpeg` (or JSON fallback if key unconfigured).

### 3. `GET /api/expenses?month=MM&year=YYYY`
Retrieves transaction items filtered by month and year.

### 4. `DELETE /api/expenses/:id`
Deletes a specific transaction by ID.
