require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || process.env.GEMINI_API_KEY || 'fallback_secret';

// Security and middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDb() {
  try {
    // Reset schema to apply new relationships
    await pool.query(`DROP TABLE IF EXISTS qa_pairs CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS users CASCADE;`);

    await pool.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE qa_pairs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log("Database schema initialized with users and qa_pairs tables.");
  } catch (err) {
    console.error("Database initialization failed:", err);
  }
}
initDb();

// JWT Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// --- Auth Endpoints ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password_hash]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to register user (email might already exist)' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- REST Endpoints ---

app.get('/api/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM qa_pairs WHERE user_id = $1 ORDER BY timestamp ASC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/pair', authenticateToken, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const result = await pool.query(
      'INSERT INTO qa_pairs (user_id, question, answer) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, question, answer]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving QA pair:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/pair/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM qa_pairs WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting QA pair:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- BFF WebSocket Proxy to Gemini ---

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  console.log('Mobile client connected to WebSocket proxy');

  // Authenticate WebSocket connection via query string
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');

  if (!token) {
    ws.close(1008, 'Auth token missing');
    return;
  }

  let userId;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    userId = decoded.id;
  } catch (err) {
    ws.close(1008, 'Invalid token');
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not configured');
    ws.close(1011, 'Server configuration error');
    return;
  }

  const GEMINI_WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const geminiWs = new WebSocket(GEMINI_WS_URL);

  geminiWs.on('open', () => {
    console.log(`BFF successfully connected to Gemini Live API for user ${userId}`);
    ws.send(JSON.stringify({ type: 'proxy_status', status: 'connected' }));
  });

  geminiWs.on('message', (data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });

  geminiWs.on('close', (code, reason) => {
    console.log(`Gemini WS closed: ${code} ${reason}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(code, reason);
    }
  });

  geminiWs.on('error', (err) => {
    console.error('Gemini WS error:', err);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'proxy_error', error: 'Gemini connection error' }));
    }
  });

  ws.on('message', (data) => {
    if (geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.send(data);
    }
  });

  ws.on('close', () => {
    console.log(`Mobile client for user ${userId} disconnected from proxy`);
    if (geminiWs.readyState === WebSocket.OPEN) {
      geminiWs.close();
    }
  });
});

server.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
