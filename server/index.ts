import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { analyzeWithOpenAI, analyzeWithGemini } from './analyzeService.ts';

// Load .env.local
dotenv.config({ path: '.env' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));

// Auth credentials from env
const VALID_USER = {
  id: process.env.LOGIN_ID || 'student',
  password: process.env.LOGIN_PASSWORD || 'UP_Student'
};

// Simple token (base64 of id:password:timestamp)
const generateToken = (userId: string) => {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
};

// Store active tokens in memory
const activeTokens = new Set<string>();

// Auth middleware
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token || !activeTokens.has(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
};

// Login endpoint
app.post('/api/login', (req, res) => {
  const { id, password } = req.body;
  if (id === VALID_USER.id && password === VALID_USER.password) {
    const token = generateToken(id);
    activeTokens.add(token);
    res.json({ token, user: id });
  } else {
    res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }
});

// API Routes
app.post('/api/analyze', requireAuth, async (req, res) => {
  try {
    const { questions, answers, pdfContext, modelType } = req.body;

    if (!questions || !answers || !modelType) {
      res.status(400).json({ error: 'Missing required fields: questions, answers, modelType' });
      return;
    }

    // Format Q&A pairs
    const qaPairs = questions.map((q: { text: string; category: string; id: number }) => ({
      question: q.text,
      category: q.category,
      userAnswer: answers[q.id] || "No Answer"
    }));

    let result;
    if (modelType === 'openai') {
      result = await analyzeWithOpenAI(qaPairs, pdfContext);
    } else {
      result = await analyzeWithGemini(qaPairs, pdfContext);
    }

    res.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`API Error:`, err.message);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Serve static files in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`   Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ loaded' : '✗ missing'}`);
  console.log(`   OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✓ loaded' : '✗ missing'}`);
});
