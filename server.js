import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// PASTE YOUR API KEYS HERE IF YOU CAN'T USE THE SECRETS MENU
// Example: const HARDCODED_KEYS = ["AIza...", "AIza..."];
const HARDCODED_KEYS = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Assistant (Streaming)
  app.post('/api/ai', async (req, res) => {
    const { prompt } = req.body;
    
    // Try to get keys from Secrets menu first, then fallback to hardcoded keys
    const rawKeys = process.env.GEMINI_API_KEY;
    let keys = [];

    if (rawKeys) {
      keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    // If no keys in Secrets, use the hardcoded ones
    if (keys.length === 0 && HARDCODED_KEYS.length > 0) {
      keys = HARDCODED_KEYS;
    }

    if (keys.length === 0) {
      return res.status(500).json({ error: "No API keys found. Please add them to either the 'Secrets' menu or the HARDCODED_KEYS array in server.js." });
    }
    
    const apiKey = keys[Math.floor(Math.random() * keys.length)];

    try {
      const ai = new GoogleGenAI({ apiKey });
      const result = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      for await (const chunk of result) {
        try {
          const text = chunk.text;
          if (text) {
            res.write(text);
          }
        } catch (e) {
          console.warn("Chunk error (likely safety filter):", e);
        }
      }
      res.end();
    } catch (error) {
      console.error("AI Server Error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to get AI response." });
      } else {
        res.end();
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    const staticPath = fs.existsSync(distPath) ? distPath : __dirname;
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`gravityOS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
