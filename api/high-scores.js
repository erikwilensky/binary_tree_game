// API endpoint for high scores
// GET /api/high-scores?difficulty=medium&traversalType=inorder
// POST /api/high-scores

const db = require('./db');

async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (req.method === 'GET') {
            const { difficulty, traversalType } = req.query;

            if (difficulty && traversalType) {
                // Get specific high score
                const result = await db.query(
                    'SELECT * FROM high_scores WHERE difficulty = $1 AND traversal_type = $2 LIMIT 1',
                    [difficulty, traversalType]
                );

                if (result.rows.length === 0) {
                    return res.status(200).json(null);
                }

                return res.status(200).json({
                    initials: result.rows[0].initials,
                    time: result.rows[0].time_taken,
                    date: result.rows[0].created_at
                });
            } else {
                // Get all high scores
                const result = await db.query(
                    'SELECT * FROM high_scores ORDER BY difficulty, traversal_type'
                );

                const scores = {};
                result.rows.forEach(row => {
                    const key = `${row.difficulty}_${row.traversal_type}`;
                    scores[key] = {
                        initials: row.initials,
                        time: row.time_taken,
                        date: row.created_at
                    };
                });

                return res.status(200).json(scores);
            }
        } else if (req.method === 'POST') {
            const { difficulty, traversalType, initials, timeTaken } = req.body;

            if (!difficulty || !traversalType || !initials || timeTaken === undefined) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Check if there's an existing high score
            const existing = await db.query(
                'SELECT * FROM high_scores WHERE difficulty = $1 AND traversal_type = $2',
                [difficulty, traversalType]
            );

            if (existing.rows.length > 0) {
                const currentTime = existing.rows[0].time_taken;
                
                // Only update if new time is better (lower)
                if (timeTaken < currentTime) {
                    await db.query(
                        'UPDATE high_scores SET initials = $1, time_taken = $2, created_at = CURRENT_TIMESTAMP WHERE difficulty = $3 AND traversal_type = $4',
                        [initials.toUpperCase().substring(0, 10), timeTaken, difficulty, traversalType]
                    );
                    return res.status(200).json({ success: true, isNewHighScore: true });
                } else {
                    return res.status(200).json({ success: true, isNewHighScore: false });
                }
            } else {
                // Insert new high score
                await db.query(
                    'INSERT INTO high_scores (difficulty, traversal_type, initials, time_taken) VALUES ($1, $2, $3, $4)',
                    [difficulty, traversalType, initials.toUpperCase().substring(0, 10), timeTaken]
                );
                return res.status(200).json({ success: true, isNewHighScore: true });
            }
        } else {
            return res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (error) {
        console.error('High scores API error:', error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = handler;

