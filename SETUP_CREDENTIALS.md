# ExpenseAI Setup Guide

## Environment variables

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=gemma2:2b
SENTRY_DSN=

# Optional legacy TTS endpoint
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
```

Transactions are stored in the backend's in-memory array and mirrored to the
browser's `expenseai_transactions` localStorage key. Backend memory is cleared
when the server restarts.

## Ollama setup

1. Install Ollama from [ollama.com](https://ollama.com).
2. Pull the configured model:

   ```bash
   ollama pull gemma2:2b
   ```

3. Verify Ollama is listening at `http://localhost:11434`.

If Ollama is unavailable, the backend uses its heuristic parser fallback.

## Install and run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

For a production-style run:

```bash
cd frontend
npm run build

cd ../backend
npm start
```

The backend serves `frontend/dist` when it exists.
