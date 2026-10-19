/**
 * app.js
 * ---------------------------------------------------------------------------
 * Express application definition for the Charity Events API (PROG2002 A3).
 *
 * This file builds and EXPORTS the Express app but does NOT call listen().
 * It works in two environments:
 *   - Local development: server.js requires this and calls app.listen(port).
 *   - cPanel / Phusion Passenger: the Node.js selector uses this file as the
 *     "Application startup file" and Passenger itself manages the HTTP server.
 *
 * On cPanel the front-end and admin pages are static files placed in the
 * public/ folder, so Express also serves them.
 * ---------------------------------------------------------------------------
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventsRouter = require('./routes/events');
const categoriesRouter = require('./routes/categories');
const organisationsRouter = require('./routes/organisations');

const app = express();

// Middleware
app.use(cors());                 // allow the client/admin pages to call the API
app.use(express.json());

// Simple request logger (helps demonstrate the API during the video)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()}  ${req.method}  ${req.originalUrl}`);
  next();
});

// API responses are dynamic. Never let them be cached/revalidated to a 304
// (a 304 carries no body and can leave the Angular HTTP client with nothing
// to emit, which hangs the UI on its loading state).
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Static front-end / admin pages (used on cPanel; harmless if absent locally)
const publicDir = path.join(__dirname, 'public');
app.use('/admin', express.static(path.join(publicDir, 'admin')));
app.use(express.static(publicDir));

// API index / health check
app.get('/api', (req, res) => {
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

// ---------------------------------------------------------------------------
// SPA fallbacks for the Angular front-ends (client + admin).
// The express.static middleware above has already served any real asset
// (JS/CSS/images/favicon). Any remaining non-API GET is therefore a client-side
// route (e.g. /search, /event/5, /admin/edit/3), so we return the matching
// index.html and let the Angular Router render the page. This keeps deep links
// and the browser's Refresh button working instead of returning the API 404.
// ---------------------------------------------------------------------------
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});
app.get('*', (req, res, next) => {
  // Unknown /api paths still get the JSON 404 below; everything else is a
  // client-side route and should load the client Angular application.
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(publicDir, 'index.html'));
});

// 404 handler for unknown API routes (and any other non-GET request)
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
    detail: err.message,  // visible in these student projects; remove in real apps
  });
});

// When running under Phusion Passenger (cPanel), the app must bind to the
// special 'passenger' socket; Passenger then manages the real HTTP server.
// (In local development this global is absent, so nothing is done here and
// server.js calls app.listen(PORT) instead.)
if (typeof PhusionPassenger !== 'undefined') {
  app.listen('passenger');
}

module.exports = app;
