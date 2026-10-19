/**
 * server.js
 * ---------------------------------------------------------------------------
 * Local development entry point for the Charity Events RESTful API.
 * The Express app itself is defined in app.js and exported (so the same app
 * can run under cPanel / Phusion Passenger). This file only verifies the
 * database connection and starts a local HTTP server with app.listen().
 *
 * On cPanel this file is NOT used; the Node.js selector loads app.js instead.
 * ---------------------------------------------------------------------------
 */
const app = require('./app');
const { testConnection } = require('./event_db');

const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Charity Events API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start the server:');
    console.error(' - ', err.message);
    console.error('Make sure MySQL is running and the .env settings are correct.');
    process.exit(1);
  }
})();
