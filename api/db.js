// Database connection utility
// Supports PostgreSQL (Supabase, Railway, PlanetScale, etc.)

const { Pool } = require('pg');

let pool = null;

function getPool() {
    if (!pool) {
        const connectionString = process.env.DATABASE_URL;
        
        if (!connectionString) {
            throw new Error('DATABASE_URL environment variable is not set');
        }

        // Supabase requires SSL, so enable it if DATABASE_SSL is true or if connection string contains supabase
        const requiresSSL = process.env.DATABASE_SSL === 'true' || connectionString.includes('supabase.co');
        
        pool = new Pool({
            connectionString: connectionString,
            ssl: requiresSSL ? { rejectUnauthorized: false } : false
        });

        // Handle pool errors
        pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }

    return pool;
}

async function query(text, params) {
    const dbPool = getPool();
    try {
        const result = await dbPool.query(text, params);
        return result;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

module.exports = { query, getPool };

