const micButton = document.getElementById("micButton");
const stateLabel = document.getElementById("stateLabel");
const stateHint = document.getElementById("stateHint");
const languageSelect = document.getElementById("languageSelect");
const clearButton = document.getElementById("clearButton");
const messagesEl = document.getElementById("messages");
const textInput = document.getElementById("textInput");
const sendButton = document.getElementById("sendButton");
const apiStatus = document.getElementById("apiStatus");
const latencyEl = document.getElementById("latency");
const hero = document.querySelector(".hero");

let conversation = [];
let recognition = null;
let isListening = false;
let finalTranscript = "";
let requestInProgress = false;

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const speechLocales = {
  auto: "en-IN",
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN"
};

function setState(label, hint, className = "") {
  stateLabel.textContent = label;
  stateHint.textContent = hint;
  hero.classList.remove("listening", "thinking");
  if (className) hero.classList.add(className);
}

function clearEmptyState() {
  const empty = messagesEl.querySelector(".empty-state");
  if (empty) empty.remove();
}

function addMessage(role, content) {
  clearEmptyState();

  const message = document.createElement("div");
  message.className = `message ${role}`;

  const label = document.createElement("span");
  label.className = "message-label";
  label.textContent = role === "user" ? "You" : "Cerebras";

  const text = document.createElement("div");
  text.textContent = content;

  message.append(label, text);
  messagesEl.appendChild(message);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return text;
}

function resetConversation() {
  conversation = [];
  messagesEl.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">◉</div>
      <p>Your conversation will appear here.</p>
      <span>Try: “माझ्यासाठी एक दिवसाचा कामाचा प्लॅन तयार कर.”</span>
    </div>
  `;
  latencyEl.textContent = "—";
  speechSynthesis.cancel();
  setState("Ready", "Click the microphone and start speaking.");
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();

    if (data.ok && data.apiKeyConfigured) {
      apiStatus.textContent = "Cerebras online";
      apiStatus.className = "status-pill online";
    } else {
      apiStatus.textContent = "API key missing";
      apiStatus.className = "status-pill offline";
    }
  } catch {
    apiStatus.textContent = "Server offline";
    apiStatus.className = "status-pill offline";
  }
}

function createRecognition() {
  if (!SpeechRecognition) {
    stateHint.textContent =
      "Voice input is not supported in this browser. Use Chrome or Edge, or type your message below.";
    micButton.disabled = true;
    return null;
  }

  const instance = new SpeechRecognition();
  instance.continuous = false;
  instance.interimResults = true;
  instance.lang = speechLocales[languageSelect.value] || "en-IN";
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    isListening = true;
    finalTranscript = "";
    micButton.classList.add("active");
    setState("Listening", "Speak now. I’m listening...", "listening");
  };

  instance.onresult = (event) => {
    let interim = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += text;
      } else {
        interim += text;
      }
    }

    stateHint.textContent = interim || finalTranscript || "Listening...";
  };

  instance.onerror = (event) => {
    console.error("Speech recognition error:", event.error);

    if (event.error === "not-allowed") {
      setState("Microphone blocked", "Allow microphone access in your browser settings.");
    } else if (event.error === "no-speech") {
      setState("No speech detected", "Click the microphone and try again.");
    } else {
      setState("Voice input error", `Speech recognition error: ${event.error}`);
    }

    stopListening();
  };

  instance.onend = async () => {
    isListening = false;
    micButton.classList.remove("active");

    const transcript = finalTranscript.trim();

    if (transcript) {
      await sendMessage(transcript);
    } else {
      setState("Ready", "Click the microphone and start speaking.");
    }
  };

  return instance;
}

function stopListening() {
  if (!recognition) return;

  try {
    recognition.stop();
  } catch {}

  isListening = false;
  micButton.classList.remove("active");
}

function startListening() {
  if (!SpeechRecognition) return;
  if (requestInProgress) return;

  speechSynthesis.cancel();
  recognition = createRecognition();

  try {
    recognition.start();
  } catch (error) {
    console.error(error);
  }
}

function speak(text) {
  if (!("speechSynthesis" in window)) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const selectedLanguage = languageSelect.value;

  utterance.lang =
    selectedLanguage === "mr"
      ? "mr-IN"
      : selectedLanguage === "hi"
      ? "hi-IN"
      : "en-IN";

  utterance.rate = 1;
  utterance.pitch = 1;

  utterance.onstart = () => {
    setState("Speaking", "Cerebras is responding...", "thinking");
  };

  utterance.onend = () => {
    setState("Ready", "Click the microphone and start speaking.");
  };

  utterance.onerror = () => {
    setState("Ready", "Response generated. Your browser could not play the voice.");
  };

  speechSynthesis.speak(utterance);
}

async function sendMessage(message) {
  const clean = message.trim();
  if (!clean || requestInProgress) return;

  requestInProgress = true;
  textInput.value = "";
  addMessage("user", clean);

  const previousHistory = [...conversation];
  conversation.push({ role: "user", content: clean });

  setState("Thinking", "Sending your request to Cerebras...", "thinking");

  const startedAt = performance.now();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: clean,
        language: languageSelect.value,
        history: previousHistory
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    const elapsed = Math.round(performance.now() - startedAt);
    latencyEl.textContent = `${elapsed} ms`;

    conversation.push({ role: "assistant", content: data.answer });

    addMessage("assistant", data.answer);
    speak(data.answer);
  } catch (error) {
    console.error(error);

    const errorText = error.message || "Something went wrong.";
    addMessage("assistant", `Error: ${errorText}`);
    setState("Error", errorText);
  } finally {
    requestInProgress = false;
    if (!speechSynthesis.speaking) {
      setState("Ready", "Click the microphone and start speaking.");
    }
  }
}

micButton.addEventListener("click", () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

sendButton.addEventListener("click", () => {
  sendMessage(textInput.value);
});

textInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage(textInput.value);
  }
});

clearButton.addEventListener("click", resetConversation);

languageSelect.addEventListener("change", () => {
  if (isListening) stopListening();

  const labels = {
    auto: "Auto detect",
    mr: "Marathi",
    hi: "Hindi",
    en: "English"
  };

  stateHint.textContent = `${labels[languageSelect.value]} selected.`;
});

checkHealth();
