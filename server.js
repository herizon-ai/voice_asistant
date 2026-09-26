import express from "express";
import dotenv from "dotenv";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.CEREBRAS_MODEL || "gpt-oss-120b";

if (!process.env.CEREBRAS_API_KEY) {
  console.warn("WARNING: CEREBRAS_API_KEY is not configured. Create a .env file first.");
}

const client = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "..", "public");

app.use(express.json({ limit: "1mb" }));
app.use(express.static(publicDir));

const LANGUAGE_NAMES = {
  auto: "the same language as the user",
  en: "English",
  hi: "Hindi",
  mr: "Marathi"
};

function cleanMessages(messages) {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter(
      (m) =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim()
    )
    .slice(-12)
    .map((m) => ({
      role: m.role,
      content: m.content.trim().slice(0, 6000)
    }));
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "cerebras-multilingual-voice-assistant",
    model: MODEL,
    apiKeyConfigured: Boolean(process.env.CEREBRAS_API_KEY)
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!process.env.CEREBRAS_API_KEY) {
      return res.status(500).json({
        error: "CEREBRAS_API_KEY is missing. Add it to your .env file."
      });
    }

    const { message, language = "auto", history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "A non-empty message is required." });
    }

    const languageName = LANGUAGE_NAMES[language] || LANGUAGE_NAMES.auto;

    const systemPrompt = `
You are Cerebras Voice Assistant, a fast, friendly multilingual voice assistant.

Rules:
- Reply naturally and conversationally.
- Reply in ${languageName}.
- If the selected language is "auto", reply in the same language the user used.
- The user may speak Marathi, Hindi, or English.
- Keep voice responses concise unless the user asks for detail.
- Avoid markdown tables and excessive formatting because your answer will be spoken aloud.
- Use simple sentences and natural punctuation.
- Never claim to have performed an action you did not perform.
`.trim();

    const messages = [
      { role: "system", content: systemPrompt },
      ...cleanMessages(history),
      { role: "user", content: message.trim().slice(0, 6000) }
    ];

    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 700
    });

    const answer =
      completion?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I could not generate a response.";

    res.json({
      ok: true,
      answer,
      model: MODEL,
      timeInfo: completion?.time_info || null
    });
  } catch (error) {
    console.error("Cerebras API error:", error);

    const status = Number(error?.status) || 500;
    const message =
      error?.message ||
      "Something went wrong while contacting the Cerebras API.";

    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: message
    });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Cerebras Voice Assistant running at http://localhost:${PORT}`);
});
