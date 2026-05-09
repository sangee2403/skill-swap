const { Pool } = require('pg');
require('dotenv').config();

const isLocal = process.env.DATABASE_URL?.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL Connection Error:', err.message);
  } else {
    console.log('✅ PostgreSQL Connected Successfully!');
    release();
  }
});

module.exports = pool;
