# 🔑 ExpenseAI Setup & Environment Credentials Guide

Welcome to **ExpenseAI**! This guide details all environment variables required for running the application, along with step-by-step instructions for setting up MongoDB Atlas, Ollama, and ElevenLabs Text-to-Speech Voice Synthesis.

---

## 📋 Required Environment Variables

The backend relies on the following environment variables. Create a `.env` file inside the `backend/` directory using these configurations:

| Variable Name | Description | Default / Example Value | Required? |
| :--- | :--- | :--- | :--- |
| `PORT` | Express server port | `5000` | Optional (Default: 5000) |
| `OLLAMA_HOST` | Ollama local instance URL | `http://localhost:11434` | Required for local LLM parsing |
| `OLLAMA_MODEL` | Ollama LLM model identifier | `gemma2:2b` | Required |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://<username>:<password>@cluster.mongodb.net/expenses` | Required |
| `SENTRY_DSN` | Sentry performance & error tracking endpoint | `https://exampleKey@o0.ingest.sentry.io/0` | Optional |
| `ELEVENLABS_API_KEY` | ElevenLabs Speech-to-Text and Text-to-Speech API key | Claim from `hacktoberfest.com/my/promos` or `elevenlabs.io` | Required for ElevenLabs transcription and TTS |
| `ELEVENLABS_VOICE_ID` | ElevenLabs Voice Model ID | `JBFqnCBsd6RMkjVDRZzb` or `21m00Tcm4TlvDq8ikWAM` | Optional (Default: `JBFqnCBsd6RMkjVDRZzb`) |

---

## 🔊 ElevenLabs Setup Guide (Hacktoberfest Challenge)

ExpenseAI integrates ElevenLabs for both microphone transcription (Speech-to-Text) and verbal confirmation feedback (Text-to-Speech).

1. **Acquire API Key:**
   - Claim your free promotional API key from [hacktoberfest.com/my/promos](https://hacktoberfest.com/my/promos) or sign up at [elevenlabs.io](https://elevenlabs.io).
   - Copy your API key from Profile -> API Keys.
   - Add it to `backend/.env`:
     ```env
     ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
     ```

2. **Select Voice ID:**
   - Choose a voice ID from the ElevenLabs Voice Library:
     - George (Natural Male): `JBFqnCBsd6RMkjVDRZzb`
     - Rachel (Natural Female): `21m00Tcm4TlvDq8ikWAM`
   - Set `ELEVENLABS_VOICE_ID` in `backend/.env`.

3. **Voice input and fallback mode:**
   - With `ELEVENLABS_API_KEY` configured, recorded microphone audio is transcribed by ElevenLabs before the expense is parsed.
   - Without a key, the app asks the browser to use its native speech-recognition API. Use Chrome or Edge for this fallback, since Firefox and Safari do not consistently provide this API.
   - Microphone access must be allowed for the app's URL in browser settings.

---

## 🍃 MongoDB Atlas Setup Guide (Free Tier)

1. **Create Account & Cluster:**
   - Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and deploy an **M0 Shared (Free)** cluster.
2. **Database & Network Credentials:**
   - Under **Security -> Database Access**, create a user with read/write access.
   - Under **Security -> Network Access**, allow access from anywhere (`0.0.0.0/0`).
3. **Connection String:**
   - Paste connection string into `backend/.env` under `MONGODB_URI`.

---

## 🦙 Ollama Local Setup Guide (`gemma2:2b`)

1. Install Ollama from [ollama.com](https://ollama.com).
2. Run `ollama pull gemma2:2b`.
3. Verify local server is listening on `http://localhost:11434`.

---

## 🚀 Quickstart Checklist

```bash
# 1. Navigate to backend & copy env template
cd backend
cp .env.example .env

# 2. Fill in MONGODB_URI and ELEVENLABS_API_KEY in backend/.env

# 3. Install dependencies & run backend
npm install
npm run dev

# 4. Open frontend at http://localhost:5000
```
