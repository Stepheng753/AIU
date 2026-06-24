const express = require('express');
const { dbGet, dbRun, dbAll } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM qa_pairs WHERE user_id = ? ORDER BY timestamp ASC', [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/pair
router.post('/pair', authenticateToken, async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const result = await dbRun(
      'INSERT INTO qa_pairs (user_id, question, answer, category) VALUES (?, ?, ?, ?)',
      [req.user.id, question, answer, category || null]
    );
    const pair = await dbGet('SELECT * FROM qa_pairs WHERE id = ?', [result.lastID]);
    res.status(201).json(pair);
  } catch (err) {
    console.error('Error saving QA pair:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/pair/:id
router.delete('/pair/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await dbRun('DELETE FROM qa_pairs WHERE id = ? AND user_id = ?', [id, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting QA pair:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/history
router.delete('/history', authenticateToken, async (req, res) => {
  try {
    await dbRun('DELETE FROM qa_pairs WHERE user_id = ?', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/transcribe
router.post('/transcribe', authenticateToken, async (req, res) => {
  try {
    const { audio } = req.body;
    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'audio/mp4',
                    data: audio
                  }
                },
                {
                  text: 'Please transcribe the following audio recording. If you cannot hear anything, return an empty string. Only return the transcription, nothing else.'
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ text: text.trim() });
  } catch (err) {
    console.error('Transcription error:', err);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

module.exports = router;
