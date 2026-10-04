# ExpenseAI

ExpenseAI is a monthly personal-finance dashboard for recording transactions
with natural-language input. It uses a local Ollama model to extract structured
transaction data, stores records in MongoDB when available, and provides
filtering, sorting, summaries, charts, and exports.

## Features

- Natural-language expense and income entry in English or Hinglish
- INR-aware parsing, including phrases such as:
  - `four fifty` -> `450`
  - `four hundred fifty` -> `450`
  - `fifteen hundred` -> `1500`
- Ollama JSON-schema parsing with deterministic temperature `0`
- Heuristic fallback parsing when Ollama is unavailable
- MongoDB persistence with automatic in-memory fallback
- Month and year navigation
- Category filter pills
- Sorting by newest, oldest, highest amount, or lowest amount
- Summary cards for spending, income, and balance
- Chart.js category doughnut chart
- Excel-compatible CSV transaction export
- PNG/JPG chart export with chart, total, and legend
- Animated React interface with Framer Motion

> Voice/TTS integration is currently disabled in the React interface. The
> backend still contains the legacy ElevenLabs endpoint for future use.

## Architecture

```text
frontend/                 React + Vite dashboard
  src/App.jsx             Application state and data flow
  src/components/         Header, input, cards, chart, transactions
  src/services/api.js     Backend API client

backend/                  Express API
  server.js               Routes, Ollama parser, persistence
  models/Expense.js       Mongoose transaction model
```

### Data flow

1. The user submits natural-language text from the React dashboard.
2. The frontend sends it to `POST /api/parse-expense`.
3. The backend asks Ollama for strict structured JSON.
4. Parsed data is saved to MongoDB, or to in-memory storage if MongoDB is
   unavailable.
5. The frontend refreshes the selected month and recalculates dashboard views.

## Requirements

- Node.js 18 or newer
- npm
- Ollama (optional, recommended for AI parsing)
- MongoDB (optional; in-memory mode is used if unavailable)

## Installation

Clone the repository and install dependencies in both applications:

```bash
git clone https://github.com/Aditya4453/DEVchallenge.git
cd DEVchallenge

cd backend
npm install

cd ../frontend
npm install
```

## Environment configuration

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
MONGODB_URI=mongodb://127.0.0.1:27017/expenses

# Optional legacy TTS configuration
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

Never commit real API keys or database credentials.

### Ollama setup

Install Ollama, start it, and pull the configured model:

```bash
ollama pull gemma2:2b
```

If Ollama is unavailable, the backend uses keyword-based fallback parsing.

## Running locally

Start the backend:

```bash
cd backend
npm run dev
```

In another terminal, start the Vite frontend:

```bash
cd frontend
npm run dev
```

For a production-style deployment, build the frontend and start the backend:

```bash
cd frontend
npm run build

cd ../backend
npm start
```

The backend serves `frontend/dist` when the production build exists.

## API

### `POST /api/parse-expense`

Parse and save a transaction.

```json
{
  "text": "four fifty coffee at CCD",
  "month": 10,
  "year": 2026
}
```

### `GET /api/expenses?month=10&year=2026`

Return transactions for the requested month, sorted newest first.

### `DELETE /api/expenses/:id`

Delete a transaction by its MongoDB or in-memory ID.

### `GET /api/health`

Return backend status, MongoDB connection state, and Ollama configuration.

### `POST /api/text-to-speech`

Legacy ElevenLabs endpoint. It is not called by the current React interface.

## Exporting data

The transaction section exports the currently filtered and sorted records as a
CSV file that opens in Excel. The chart section exports the complete category
breakdown as PNG or JPG, including:

- Doughnut chart
- Total spent in the chart center
- Category legend
- Percentages and amounts

Export filenames include the active filter and selected month/year.

## Development commands

### Frontend

```bash
npm run dev       # Start Vite development server
npm run build     # Create production build
npm run preview   # Preview production build
```

### Backend

```bash
npm start         # Start Express server
npm run dev       # Start with Node watch mode
```

## Troubleshooting

- **Ollama connection errors:** Confirm Ollama is running and that
  `OLLAMA_MODEL` has been pulled. The heuristic parser will still accept basic
  inputs.
- **MongoDB connection errors:** Verify `MONGODB_URI`; the application
  continues with temporary in-memory storage.
- **Frontend API errors in development:** Ensure the backend is running on the
  configured API origin and that the Vite development setup is being used.
- **No transactions shown:** Check the selected month and year.

## Project notes

- `PROJECT_INFO.txt` contains a detailed architecture and codebase inventory.
- Gemini dependencies are present in the backend package, but the current
  server uses Ollama and does not implement an active Gemini parser.
- The current Mongoose category enum and the Ollama schema should remain
  aligned when adding categories.

## License

This project is released under the MIT License.
