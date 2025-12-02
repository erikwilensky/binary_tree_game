// Serverless function to save high scores to GitHub Gist
// Deploy this to Vercel, Netlify, or similar
// Set GITHUB_TOKEN as an environment variable with your token

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { scores, gistId, filename } = req.body;
    
    // Use environment variable for token (set this in Vercel/Netlify dashboard)
    const token = process.env.GITHUB_TOKEN;

    if (!token) {
        return res.status(500).json({ error: 'GitHub token not configured' });
    }

    try {
        const response = await fetch(`https://api.github.com/gists/${gistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'BinaryTreeGame'
            },
            body: JSON.stringify({
                files: {
                    [filename]: {
                        content: JSON.stringify(scores, null, 2)
                    }
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('GitHub API error:', response.status, errorText);
            return res.status(response.status).json({ error: errorText });
        }

        const result = await response.json();
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('Error saving to Gist:', error);
        return res.status(500).json({ error: error.message });
    }
}

