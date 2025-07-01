# Dallama: 

A simple client/server set up for running your own LLM-powered chat agent locally

## LLM model
This uses `node-llama-cpp` in the backend.  To use, download a gguf compiled model from [here](https://huggingface.co/mradermacher) and place in `[repo_root]/models`.
Update the model name in `src/vosk.ts` to match your model name.

## STT model
This project uses [vosk speech-to-text processing](https://alphacephei.com/vosk/models) for relatively light weight STT.  Download your preferred model from [here](https://alphacephei.com/vosk/models) and then decompress in `models/[your_vosk_model]`.  Note, prefererably use `vosk-model-small-en-us-0.15` since the STT is done client-side and otherwise you will download a multiple GB model into your browser.  I dunno, haven't tried it.  The small model has worked well enough for my local development.

Then, go to `vosk-stt-app/src/components/ModelLoader.tsx` and change the model directory name if you use something other than the small model linked above.

Then, follow below instructions to get started.

# Backend & Frontend Setup

## Backend (Node.js + TypeScript)

1. **Install dependencies & download model:**
   ```bash
   npm install
   ```
2. **Start the backend service:**
   ```bash
   npm start
   ```

---

## Frontend (Vosk STT Web App)

1. **Navigate to the frontend directory:**
   ```bash
   cd vosk-stt-app
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start the frontend dev server:**
   ```bash
   npm run dev
   ```

The frontend will be available at the local address printed in your terminal (default: http://localhost:5173).
