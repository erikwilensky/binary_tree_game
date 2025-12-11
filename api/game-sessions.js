// API endpoint for game sessions (analytics)
// POST /api/game-sessions

const db = require('./db');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'POST') {
            const { sessionId, difficulty, traversalType, correct, timeTaken } = req.body;

            if (!sessionId) {
                return res.status(400).json({ error: 'Missing sessionId' });
            }

            await db.query(
                'INSERT INTO game_sessions (session_id, difficulty, traversal_type, correct, time_taken) VALUES ($1, $2, $3, $4, $5)',
                [sessionId, difficulty || null, traversalType || null, correct || false, timeTaken || null]
            );

            return res.status(200).json({ success: true });
        } else if (req.method === 'GET') {
            // Optional: Get analytics data
            const { limit = 100 } = req.query;
            
            const result = await db.query(
                'SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT $1',
                [parseInt(limit)]
            );

            return res.status(200).json(result.rows);
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Game sessions API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = handler;

