require('dotenv').config({ quiet: true });
const http = require('http');
const app = require('./app');
const { db } = require('./config/db');
const { setupGeminiProxy } = require('./services/geminiProxy');

const port = process.env.PORT || 3000;

// Enforce GEMINI_API_KEY presence
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('FATAL ERROR: GEMINI_API_KEY is required but not defined in the environment.');
  process.exit(1);
}

const server = http.createServer(app);

// Mount WebSocket Server
setupGeminiProxy(server);

if (process.env.NODE_ENV !== 'test') {
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = { app, server, db };
