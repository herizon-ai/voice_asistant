# Cerebras Multilingual Voice Assistant

A browser-based multilingual voice assistant powered by the **Cerebras API**.

It supports:

- English
- Hindi
- Marathi
- Voice input through the browser
- Cerebras-powered AI responses
- Browser text-to-speech
- Conversation history
- Response latency display
- Mobile-responsive UI

## Architecture

```text
Microphone
   |
   v
Browser Speech Recognition
   |
   v
Node.js / Express backend
   |
   v
Cerebras API
   |
   v
AI response
   |
   v
Browser Text-to-Speech
   |
   v
Speaker
```

The Cerebras API key stays on the server and is never exposed to browser JavaScript.

## Requirements

- Node.js 18 LTS or newer
- A Cerebras account
- A Cerebras API key
- Google Chrome or Microsoft Edge recommended for browser speech recognition

Cerebras' official Node SDK supports Node.js 18 LTS or newer.

## 1. Get the project

Clone your GitHub repository:

```bash
git clone https://github.com/YOUR_USERNAME/cerebras-multilingual-voice-assistant.git
cd cerebras-multilingual-voice-assistant
```

Or download the repository as ZIP and extract it.

## 2. Install dependencies

```bash
npm install
```

## 3. Create your environment file

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Windows Command Prompt:

```cmd
copy .env.example .env
```

Then open `.env` and add your real Cerebras API key:

```env
CEREBRAS_API_KEY=your_real_api_key_here
PORT=3000
CEREBRAS_MODEL=gpt-oss-120b
```

Get the API key from:

https://cloud.cerebras.ai/

**Never commit `.env` to GitHub.**

## 4. Start the application

```bash
npm start
```

You should see:

```text
Cerebras Voice Assistant running at http://localhost:3000
```

Open:

http://localhost:3000

## 5. Test it

1. Allow microphone permission.
2. Select Marathi, Hindi, English, or Auto detect.
3. Click the microphone.
4. Speak.
5. Wait for the Cerebras response.
6. The response will appear and be spoken by your browser.

Example Marathi prompt:

```text
माझ्यासाठी आजचा कामाचा प्लॅन तयार कर.
```

Example Hindi prompt:

```text
मुझे डिजिटल मार्केटिंग के लिए तीन नए आइडिया दो।
```

Example English prompt:

```text
Give me three ideas for a small AI product.
```

## Development mode

For automatic server restart while editing:

```bash
npm run dev
```

## GitHub setup

Create a new empty GitHub repository named:

```text
cerebras-multilingual-voice-assistant
```

Then:

```bash
git init
git add .
git commit -m "Initial Cerebras multilingual voice assistant"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cerebras-multilingual-voice-assistant.git
git push -u origin main
```

## Security

The API key is intentionally read from:

```text
process.env.CEREBRAS_API_KEY
```

The browser never receives the API key.

The `.gitignore` file prevents `.env` from being committed.

Before pushing to GitHub, verify:

```text
.env
```

is not included in your commit.

## Project structure

```text
cerebras-multilingual-voice-assistant/
│
├── public/
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── server/
│   └── server.js
│
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## How Cerebras is used

The backend initializes the official Cerebras Node SDK:

```js
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY
});
```

It then sends the conversation to Cerebras:

```js
const completion = await client.chat.completions.create({
  model: "gpt-oss-120b",
  messages
});
```

The assistant uses the selected language instruction so the response can be spoken in English, Hindi, or Marathi.

## Important browser note

Speech recognition and speech synthesis are provided by the browser in this MVP. Browser support and available voices can vary by browser and operating system.

For the smoothest local demo, use a current version of Chrome or Edge and allow microphone access.

## Future improvements

For a production-grade real-time voice experience, the next version could add:

- Dedicated speech-to-text service
- Dedicated multilingual text-to-speech service
- Streaming Cerebras responses
- WebSocket/SSE response streaming
- Voice activity detection
- Interruptible speech
- Authentication
- Conversation persistence
- Rate limiting
- Usage analytics
- Deployable cloud hosting

## Credits

Built as a Cerebras API demonstration project.

Cerebras documentation:
https://inference-docs.cerebras.ai/

Official Node SDK:
https://github.com/Cerebras/cerebras-cloud-sdk-node
