# ExpenseAI

ExpenseAI is a React and Express personal-finance dashboard. Enter an expense
or income item in natural language, review monthly analytics, filter and sort
transactions, and export the current view.

Transactions are stored locally:

- The backend keeps an in-memory array while it is running.
- The frontend mirrors transactions in browser `localStorage`, so browser
  reloads do not lose them.
- Backend memory is cleared when the backend process restarts.

## What it includes

- English and Hinglish natural-language transaction input
- Local Ollama parsing with strict JSON output
- Keyword-based parser fallback when Ollama is unavailable
- INR phrase handling such as `four fifty` -> `450`
- Monthly summary cards and Chart.js category breakdown
- Category filters and newest/oldest/amount sorting
- Excel-compatible CSV transaction export
- Full PNG/JPG chart export with legend and totals
- Responsive React UI with Framer Motion

The current React interface does not use voice/STT/TTS. Legacy ElevenLabs
backend code remains available but is not part of the active dashboard flow.

## Requirements

- Node.js 18+
- npm
- Ollama (optional, recommended)

MongoDB is not required.

## Project structure

```text
backend/
  server.js              Express API, Ollama parser, in-memory storage
  package.json
  .env.example

frontend/
  src/App.jsx            App state, API calls, filtering, sorting, persistence
  src/components/        Dashboard UI, chart, summaries, transactions
  src/services/api.js    API client
  vite.config.js         Vite server and /api proxy

PROJECT_INFO.txt         Detailed architecture notes
```

## 1. Install

From the project root:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 2. Configure the backend

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
SENTRY_DSN=

# Optional legacy TTS settings; not used by the current React UI
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

Do not commit real API keys. The backend does not require a database
connection string.

## 3. Optional Ollama setup

Install Ollama, start the Ollama service, and pull the configured model:

```bash
ollama pull gemma2:2b
```

The backend expects Ollama at `http://localhost:11434` by default. To use a
different host or model, update `backend/.env`.

If Ollama is not running, the backend falls back to keyword-based parsing.

## 4. Run in development

Open two terminals from the project root.

Terminal 1 - backend:

```bash
cd backend
npm run dev
```

Terminal 2 - frontend:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Vite proxies `/api`
requests to the backend at `http://localhost:5000`.

## Production-style run

Build the frontend:

```bash
cd frontend
npm run build
```

Start the backend:

```bash
cd ../backend
npm start
```

When `frontend/dist` exists, Express serves the built frontend. Open
[http://localhost:5000](http://localhost:5000).

## Using the dashboard

1. Select a month and year.
2. Enter text such as:

   ```text
   aaj four fifty coffee at CCD
   got 25000 salary
   ```

3. Submit the entry and wait for the transaction list to refresh.
4. Use category pills and the sort selector to change the dashboard view.
5. Use the small download controls:
   - Transactions: Excel-compatible `.csv`
   - Category chart: `.png` or `.jpg`

Exports use the active category, month, year, and sort settings in their
filenames.

## API endpoints

The backend runs on port `5000` by default.

### `POST /api/parse-expense`

Parse and store a transaction:

```json
{
  "text": "four fifty coffee at CCD",
  "month": 10,
  "year": 2026
}
```

### `GET /api/expenses?month=10&year=2026`

Return transactions for the requested month and year, sorted newest first.

### `DELETE /api/expenses/:id`

Delete a transaction by its local ID.

### `GET /api/health`

Return backend status and Ollama configuration.

## Useful commands

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Backend

```bash
npm start
npm run dev
```

## Troubleshooting

### The dashboard cannot reach the API

Confirm the backend is running on port `5000`, then restart the Vite dev
server. The frontend development proxy is configured in
`frontend/vite.config.js`.

### Ollama parsing fails

Check that Ollama is running and the model exists:

```bash
ollama list
ollama pull gemma2:2b
```

Basic entries can still be parsed by the backend fallback.

### Transactions disappear after restarting the backend

This is expected. Backend storage is intentionally in-memory. The frontend
localStorage mirror protects browser reloads, but it cannot restore data after
the backend process loses its in-memory records.

## License

MIT
