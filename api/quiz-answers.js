// API endpoint for quiz answers
// GET /api/quiz-answers
// POST /api/quiz-answers
// PUT /api/quiz-answers/:teamName

const db = require('./db');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            // Get all quiz answers
            const result = await db.query(
                'SELECT team_name, answer, locked, timestamp, updated_at FROM quiz_answers ORDER BY team_name'
            );

            const answers = {};
            result.rows.forEach(row => {
                answers[row.team_name] = {
                    answer: row.answer,
                    locked: row.locked,
                    timestamp: row.timestamp
                };
            });

            return res.status(200).json(answers);
        } else if (req.method === 'POST' || req.method === 'PUT') {
            const { teamName, answer, locked, timestamp } = req.body;

            if (!teamName || answer === undefined) {
                return res.status(400).json({ error: 'Missing required fields: teamName and answer' });
            }

            // Check if team answer exists
            const existing = await db.query(
                'SELECT * FROM quiz_answers WHERE team_name = $1',
                [teamName]
            );

            if (existing.rows.length > 0) {
                // Update existing answer
                await db.query(
                    'UPDATE quiz_answers SET answer = $1, locked = $2, timestamp = $3, updated_at = CURRENT_TIMESTAMP WHERE team_name = $4',
                    [answer, locked || false, timestamp || new Date().toISOString(), teamName]
                );
            } else {
                // Insert new answer
                await db.query(
                    'INSERT INTO quiz_answers (team_name, answer, locked, timestamp) VALUES ($1, $2, $3, $4)',
                    [teamName, answer, locked || false, timestamp || new Date().toISOString()]
                );
            }

            return res.status(200).json({ success: true });
        } else if (req.method === 'DELETE') {
            const { teamName } = req.query;

            if (!teamName) {
                return res.status(400).json({ error: 'Missing teamName parameter' });
            }

            await db.query(
                'DELETE FROM quiz_answers WHERE team_name = $1',
                [teamName]
            );

            return res.status(200).json({ success: true });
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('Quiz answers API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = handler;

