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

  // API Route for AI Assistant (Streaming)
  app.post('/api/ai', async (req, res) => {
    const { prompt } = req.body;
    const rawKeys = process.env.GEMINI_API_KEY;

    if (!rawKeys) {
      return res.status(500).json({ error: "GEMINI_API_KEY not found in server environment." });
    }

    const keys = rawKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
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
        if (chunk.text) {
          res.write(chunk.text);
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
