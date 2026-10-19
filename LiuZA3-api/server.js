/**
 * server.js
 * ---------------------------------------------------------------------------
 * Entry point for the Charity Events RESTful API (PROG2002 Assessment 3).
 * Sets up Express, CORS, JSON parsing, the API routes and centralised error
 * handling, then verifies the database connection on start-up.
 *
 * Assessment 3 adds: event C.R.U.D. for the admin site, event registration
 * for the public site, the organisations lookup, and an /all admin listing.
 * ---------------------------------------------------------------------------
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./event_db');
const eventsRouter = require('./routes/events');
const categoriesRouter = require('./routes/categories');
const organisationsRouter = require('./routes/organisations');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());                 // allow the client/admin pages to call the API
app.use(express.json());

// Simple request logger (helps demonstrate the API during the video)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.originalUrl}`);
  next();
});

// API index / health check
app.get('/', (req, res) => {
  res.json({
    name: 'Charity Events API',
    status: 'running',
    assessment: 'PROG2002 Assessment 3',
    endpoints: [
      'GET    /api/events',
      'GET    /api/events/all            (admin: every status)',
      'GET    /api/events/all/:id        (admin: any status + registrations)',
      'GET    /api/events/:id            (includes registrations)',
      'POST   /api/events                 (admin: create)',
      'PUT    /api/events/:id             (admin: update)',
      'DELETE /api/events/:id             (admin: delete, integrity-checked)',
      'POST   /api/events/:id/registrations (public: register)',
      'GET    /api/categories',
      'GET    /api/organisations',
    ],
  });
});

// API routes
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/organisations', organisationsRouter);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralised error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred.',
    detail: err.message,
  });
});

// Start the server after confirming the database is reachable
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
