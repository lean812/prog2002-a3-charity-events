/**
 * event_db.js
 * ---------------------------------------------------------------------------
 * Creates and exports the MySQL connection pool for the charityevents_db
 * database using the mysql2 driver (Promise API).
 *
 * Connection settings are read from environment variables (see .env) so that
 * credentials are not hard-coded. The pool is reused across all API routes.
 * ---------------------------------------------------------------------------
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// A connection pool opens a small number of reusable connections and is more
// efficient than creating a new connection for every request.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'charityevents_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

/**
 * Helper that runs a parameterised query and returns the rows.
 * @param {string} sql        SQL statement, using ? placeholders
 * @param {Array}  params     values bound to the placeholders
 * @returns {Promise<Array>}  the resulting rows
 */
async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/**
 * Simple connectivity check used at server start-up.
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log('Successfully connected to the charityevents_db database.');
  } finally {
    connection.release();
  }
}

module.exports = { pool, query, testConnection };
