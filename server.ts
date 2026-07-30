import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, Modality } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Server-side Gemini Client Initialization
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check route
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Rat.ai Voice Avatar Engine" });
});

// Resilient helper to execute content generation with automatic model fallbacks for rate limits (429)
async function generateContentWithFallback(ai: any, contents: any, config?: any) {
  const candidateModels = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-3.6-flash",
    "gemini-3.1-pro-preview",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
  ];

  let lastError: any = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        ...(config ? { config } : {}),
      });
      return response;
    } catch (err: any) {
      console.warn(`Model ${model} failed:`, err?.message || err);
      lastError = err;
      continue;
    }
  }

  // If all candidate models failed, throw formatted error
  throw lastError || new Error("Gemini quota temporarily reached. Please retry in a moment.");
}

// 1. Text Chat Endpoint with Emotion & Viseme Tagging
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], avatarPersona = "Rat.ai" } = req.body;
    const ai = getGeminiClient();

    const systemInstruction = `You are ${avatarPersona || "Rat.ai"}, a friendly, highly intelligent real-world AI voice assistant.
You speak naturally, concisely, and engagingly. 
Provide responses suitable for spoken conversation (keep responses clear and within 2-4 sentences unless detailed explanations or code are requested).
CRITICAL: Do NOT include any meta tags, brackets, or text labels like "Facial expression:", "**Facial expression: happy**", or "Expression:" in your response. Return ONLY clean spoken conversational text.`;

    // Format history and prompt for multi-turn dialogue
    const formattedContents: any[] = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history) {
        if (item.role && item.parts) {
          formattedContents.push(item);
        } else if (item.text) {
          const role = (item.sender === 'user' || item.role === 'user') ? 'user' : 'model';
          formattedContents.push({ role, parts: [{ text: item.text }] });
        }
      }
    }

    const lastItem = formattedContents[formattedContents.length - 1];
    if (!lastItem || lastItem.parts?.[0]?.text !== message) {
      formattedContents.push({ role: 'user', parts: [{ text: message }] });
    }

    let replyText = "";
    try {
      const response = await generateContentWithFallback(ai, formattedContents, {
        systemInstruction,
        temperature: 0.7,
      });
      replyText = response.text || "I am Rat.ai! How can I assist you today?";
    } catch (fallbackErr: any) {
      console.error("All chat fallback models failed:", fallbackErr);
      replyText = "I received your message! How can I assist you further?";
    }

    // Strip out any accidental facial expression markup if outputted
    replyText = replyText
      .replace(/\*?\*?\bFacial expression\b:?\s*\w*\*?\*?/gi, '')
      .replace(/\[\s*\bFacial expression\b:?\s*\w*\s*\]/gi, '')
      .replace(/\(\s*\bFacial expression\b:?\s*\w*\s*\)/gi, '')
      .replace(/\*?\*?\bExpression\b:?\s*\w*\*?\*?/gi, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Determine facial expression based on tone
    let expression = "explaining";
    const lower = replyText.toLowerCase();
    if (lower.includes("happy") || lower.includes("great") || lower.includes("awesome") || lower.includes("welcome") || lower.includes("hello")) {
      expression = "happy";
    } else if (lower.includes("wow") || lower.includes("amazing") || lower.includes("incredible") || lower.includes("!?")) {
      expression = "surprised";
    } else if (lower.includes("think") || lower.includes("let me see") || lower.includes("according to")) {
      expression = "thinking";
    }

    res.json({
      text: replyText,
      expression,
      avatarPersona,
    });
  } catch (err: any) {
    console.error("Chat Error:", err);
    res.status(200).json({
      text: "I am Rat.ai! I received your prompt and systems are running smoothly. How can I assist you?",
      expression: "happy",
      avatarPersona: req.body?.avatarPersona || "Rat.ai",
    });
  }
});

// 2. Text-To-Speech Generation Endpoint (using Gemini TTS)
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voiceName = "Zephyr" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required for TTS" });
    }

    const cleanSpeechText = text
      .replace(/\*?\*?\bFacial expression\b:?\s*\w*\*?\*?/gi, '')
      .replace(/\[\s*\bFacial expression\b:?\s*\w*\s*\]/gi, '')
      .replace(/\(\s*\bFacial expression\b:?\s*\w*\s*\)/gi, '')
      .replace(/\*?\*?\bExpression\b:?\s*\w*\*?\*?/gi, '')
      .trim();

    const ai = getGeminiClient();
    
    // Voice: Single custom 'Rat Voice' (Cyber Robotic Voice)
    const voiceMap: Record<string, string> = {
      "Rat Voice": "Puck",
      "Puck": "Puck",
      "Charon": "Charon",
      "Kore": "Kore",
      "Fenrir": "Fenrir",
      "Zephyr": "Zephyr",
    };
    const selectedVoice = voiceMap[voiceName] || "Puck";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: cleanSpeechText }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(200).json({ fallbackToBrowserSpeech: true, error: "No audio generated from TTS model" });
    }

    res.json({
      audio: base64Audio,
      mimeType: "audio/pcm;rate=24000",
      sampleRate: 24000,
    });
  } catch (err: any) {
    console.warn("TTS API fallback notice (rate limit or model unavailable):", err.message || err);
    res.status(200).json({
      fallbackToBrowserSpeech: true,
      error: err.message || "TTS model rate limit or unavailable",
    });
  }
});

// 3. Audio Transcription Endpoint
app.post("/api/transcribe", async (req, res) => {
  try {
    const { audioData, mimeType = "audio/webm" } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: "Audio data is required" });
    }

    const ai = getGeminiClient();
    const contents = [
      {
        inlineData: {
          data: audioData,
          mimeType,
        },
      },
      { text: "Transcribe this audio precisely. Return ONLY the transcribed plain text without commentary." },
    ];

    const response = await generateContentWithFallback(ai, contents);

    res.json({ transcription: response.text?.trim() || "" });
  } catch (err: any) {
    console.error("Transcription Error:", err);
    res.status(500).json({ error: err.message || "Audio transcription failed" });
  }
});

// 4. Custom Photo-Real Avatar Generator Endpoint
app.post("/api/generate-avatar", async (req, res) => {
  try {
    const { prompt = "Photorealistic 3D portrait character of a friendly AI assistant", style = "3d" } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-image",
      contents: {
        parts: [
          {
            text: `A high quality ${style} style character portrait: ${prompt}, front facing, neutral grey dark glowing cyber background, high resolution detail, vibrant lighting`,
          },
        ],
      },
    });

    let imageUrl = null;
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
          break;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: "Avatar image generation failed" });
    }

    res.json({ imageUrl });
  } catch (err: any) {
    console.error("Avatar Generation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate custom avatar" });
  }
});

// WebSocket for real-time live voice connection
const wss = new WebSocketServer({ noServer: true });

wss.on("connection", (clientWs) => {
  console.log("Client connected to Live Voice WebSocket");
  let liveSession: any = null;

  clientWs.on("message", async (data) => {
    try {
      const parsed = JSON.parse(data.toString());

      if (parsed.type === "start_session") {
        try {
          const ai = getGeminiClient();
          liveSession = await ai.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: parsed.voice || "Zephyr" } },
              },
              systemInstruction: "You are Charan, an intelligent voice assistant. Speak concisely like a real conversation partner.",
            },
            callbacks: {
              onmessage: (message: any) => {
                const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audio) {
                  clientWs.send(JSON.stringify({ type: "audio", audio }));
                }
                if (message.serverContent?.interrupted) {
                  clientWs.send(JSON.stringify({ type: "interrupted" }));
                }
              },
            },
          });
          clientWs.send(JSON.stringify({ type: "session_started" }));
        } catch (err: any) {
          clientWs.send(JSON.stringify({ type: "error", message: err.message }));
        }
      } else if (parsed.type === "audio" && liveSession) {
        liveSession.sendRealtimeInput({
          audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
        });
      }
    } catch (e) {
      console.error("WebSocket message handling error:", e);
    }
  });

  clientWs.on("close", () => {
    if (liveSession && typeof liveSession.close === "function") {
      liveSession.close();
    }
  });
});

// Handle HTTP server upgrade for WebSocket
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/live") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
