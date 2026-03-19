import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI Assistant
  app.post('/api/ai', async (req, res) => {
    const { prompt } = req.body;
    const rawKeys = process.env.GEMINI_API_KEY;

    if (!rawKeys) {
      return res.status(500).json({ error: "GEMINI_API_KEY not found in server environment. Please add it to AI Studio Secrets." });
    }

    // Split keys by comma and pick one at random
    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
    if (keys.length === 0) {
      return res.status(500).json({ error: "No valid API keys found in GEMINI_API_KEY environment variable." });
    }
    
    const apiKey = keys[Math.floor(Math.random() * keys.length)];

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("AI Server Error:", error);
      res.status(500).json({ error: "Failed to get AI response. Check your API key and network connection." });
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
