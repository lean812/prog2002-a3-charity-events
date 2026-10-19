/**
 * routes/events.js
 * ---------------------------------------------------------------------------
 * RESTful endpoints for the charity "events" resource.
 *
 * Public website (Assessment 2 behaviour, kept):
 *   GET  /api/events                Home list / Search filters (active+upcoming)
 *   GET  /api/events/:id            One event + ALL its registrations (A3)
 *
 * Public registration (Assessment 3):
 *   POST /api/events/:id/registrations   Buy ticket(s) for one event
 *
 * Admin website (Assessment 3): full C.R.U.D.
 *   GET    /api/events/all          Every event, regardless of status
 *   POST   /api/events              Create a new event
 *   PUT    /api/events/:id          Update an existing event
 *   DELETE /api/events/:id          Delete an event (blocked if registrations exist)
 *
 * NOTE ON ROUTE ORDER: "/all" is registered BEFORE "/:id", otherwise Express
 * would treat the word "all" as an :id value.
 * ---------------------------------------------------------------------------
 */
const express = require('express');
const { query } = require('../event_db');

const router = express.Router();

// Columns shared by the Home and Search summary views
const LIST_COLUMNS = `
  e.event_id, e.event_name, e.summary, e.event_date, e.start_time,
  e.location_name, e.address, e.city, e.latitude, e.longitude,
  e.ticket_price, e.goal_amount, e.raised_amount, e.image_url,
  c.category_id, c.category_name,
  o.org_id, o.org_name
`;

// DECIMAL columns come back from the MySQL driver as strings, so they are
// converted to real numbers before the JSON is sent to the browser.
const NUMERIC_FIELDS = [
  'latitude', 'longitude', 'ticket_price', 'goal_amount',
  'raised_amount', 'total_amount', 'registration_count', 'tickets_sold',
];

function normaliseEvent(row) {
  const out = { ...row };
  NUMERIC_FIELDS.forEach((field) => {
    if (out[field] !== undefined && out[field] !== null) {
      out[field] = Number(out[field]);
    }
  });
  // Derived status: "active" but with a date in the past is shown as "past".
  if (out.event_date && out.status === 'active') {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
    out.is_upcoming = out.event_date >= today;
    out.display_status = out.is_upcoming ? 'active' : 'past';
  } else if (out.status === 'suspended') {
    out.is_upcoming = null;
    out.display_status = 'suspended';
  }
  return out;
}

// Simple email shape check (the browser performs the same check).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ===========================================================================
// GET /api/events  - public Home / Search list (active + upcoming only)
// ===========================================================================
router.get('/', async (req, res, next) => {
  try {
    const { date, location, category_id } = req.query;

    // Base condition: only active (never suspended) and upcoming events.
    const conditions = ["e.status = 'active'", 'e.event_date >= CURDATE()'];
    const params = [];

    if (date) {
      conditions.push('e.event_date = ?');
      params.push(date);
    }
    if (location && location.trim() !== '') {
      conditions.push(
        '(e.city LIKE ? OR e.location_name LIKE ? OR e.address LIKE ?)'
      );
      const like = `%${location.trim()}%`;
      params.push(like, like, like);
    }
    if (category_id) {
      conditions.push('e.category_id = ?');
      params.push(category_id);
    }

    const sql = `
      SELECT ${LIST_COLUMNS}
      FROM events e
      JOIN categories c   ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id = e.org_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY e.event_date ASC, e.start_time ASC;
    `;

    const rows = await query(sql, params);
    const events = rows.map(normaliseEvent);

    res.json({
      success: true,
      count: events.length,
      filters_applied: {
        date: date || null,
        location: location || null,
        category_id: category_id || null,
      },
      data: events,
    });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// GET /api/events/all  - ADMIN list of every event (active, past, suspended)
// Must be declared before GET /:id.
// ===========================================================================
router.get('/all', async (req, res, next) => {
  try {
    const sql = `
      SELECT e.*, c.category_name, o.org_name,
             (SELECT COUNT(*)
                FROM registrations r WHERE r.event_id = e.event_id)
                AS registration_count,
             (SELECT COALESCE(SUM(r.num_tickets), 0)
                FROM registrations r WHERE r.event_id = e.event_id)
                AS tickets_sold
      FROM events e
      JOIN categories c    ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id = e.org_id
      ORDER BY e.event_date DESC, e.event_id DESC;
    `;
    const rows = await query(sql);
    res.json({ success: true, count: rows.length, data: rows.map(normaliseEvent) });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// GET /api/events/all/:id  - ADMIN single-event detail. Unlike the public
// /:id route this returns events of ANY status (including suspended) together
// with their registrations, used to pre-fill the Update form. Must also be
// declared before GET /:id.
// ===========================================================================
router.get('/all/:id', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric event id is required.',
      });
    }

    const eventSql = `
      SELECT e.*, c.category_name,
             o.org_name, o.mission AS org_mission
      FROM events e
      JOIN categories c   ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id = e.org_id
      WHERE e.event_id = ?;
    `;
    const eventRows = await query(eventSql, [eventId]);
    if (eventRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No event found with id ${eventId}.`,
      });
    }

    const regSql = `
      SELECT registration_id, full_name, email, phone,
             registration_date, num_tickets, total_amount, created_at
      FROM registrations
      WHERE event_id = ?
      ORDER BY registration_date DESC, registration_id DESC;
    `;
    const registrations = (await query(regSql, [eventId])).map((r) => ({
      ...r,
      num_tickets: Number(r.num_tickets),
      total_amount: Number(r.total_amount),
    }));

    const event = normaliseEvent(eventRows[0]);
    event.registrations = registrations;
    event.registration_count = registrations.length;
    event.tickets_sold = registrations.reduce((sum, r) => sum + r.num_tickets, 0);

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// GET /api/events/:id  - public detail of one ACTIVE event plus its
// registrations, ordered by the latest purchase date first.
// ===========================================================================
router.get('/:id', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric event id is required.',
      });
    }

    const eventSql = `
      SELECT e.*, c.category_name,
             o.org_name, o.mission AS org_mission,
             o.contact_email AS org_email, o.contact_phone AS org_phone,
             o.website AS org_website, o.address AS org_address
      FROM events e
      JOIN categories c   ON c.category_id = e.category_id
      JOIN organisations o ON o.org_id = e.org_id
      WHERE e.event_id = ? AND e.status = 'active';
    `;
    const eventRows = await query(eventSql, [eventId]);

    if (eventRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No active event found with id ${eventId}.`,
      });
    }

    // All registrations for this event, newest purchase first.
    const regSql = `
      SELECT registration_id, full_name, email, phone,
             registration_date, num_tickets, total_amount, created_at
      FROM registrations
      WHERE event_id = ?
      ORDER BY registration_date DESC, registration_id DESC;
    `;
    const registrations = (await query(regSql, [eventId])).map((r) => ({
      ...r,
      num_tickets: Number(r.num_tickets),
      total_amount: Number(r.total_amount),
    }));

    const event = normaliseEvent(eventRows[0]);
    event.progress_percent =
      event.goal_amount > 0
        ? Math.min(100, Math.round((event.raised_amount / event.goal_amount) * 100))
        : 0;
    event.registrations = registrations;
    event.registration_count = registrations.length;
    event.tickets_sold = registrations.reduce(
      (sum, r) => sum + r.num_tickets,
      0
    );

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// POST /api/events  - ADMIN create a new event.
// Only the columns in the white list are accepted, and every value is bound
// through a parameterised statement (no string concatenation).
// ===========================================================================
const EVENT_FIELDS = [
  'event_name', 'summary', 'full_description', 'category_id', 'org_id',
  'event_date', 'start_time', 'end_time', 'location_name', 'address', 'city',
  'latitude', 'longitude', 'ticket_price', 'goal_amount', 'raised_amount',
  'image_url', 'status',
];

function readEventBody(body) {
  const data = {};
  EVENT_FIELDS.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  // Empty strings from the form are treated as NULL for optional fields.
  ['summary', 'full_description', 'start_time', 'end_time', 'location_name',
   'address', 'city', 'latitude', 'longitude', 'goal_amount', 'raised_amount',
   'image_url'].forEach((field) => {
    if (data[field] === '') data[field] = null;
  });
  return data;
}

function validateEvent(data, { partial = false } = {}) {
  const errors = [];
  const required = ['event_name', 'category_id', 'org_id', 'event_date', 'ticket_price'];
  required.forEach((field) => {
    if (!partial || data[field] !== undefined) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        errors.push(`${field} is required.`);
      }
    }
  });
  if (data.event_date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(data.event_date)) {
    errors.push('event_date must be in YYYY-MM-DD format.');
  }
  if (data.ticket_price !== undefined &&
      (Number.isNaN(Number(data.ticket_price)) || Number(data.ticket_price) < 0)) {
    errors.push('ticket_price must be a number greater than or equal to 0.');
  }
  if (data.status !== undefined && !['active', 'suspended'].includes(data.status)) {
    errors.push("status must be 'active' or 'suspended'.");
  }
  return errors;
}

router.post('/', async (req, res, next) => {
  try {
    const data = readEventBody(req.body);
    const errors = validateEvent(data);
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const columns = Object.keys(data);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO events (${columns.join(', ')}) VALUES (${placeholders});`;
    const result = await query(sql, Object.values(data));

    res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      data: { event_id: result.insertId, ...data },
    });
  } catch (err) {
    // Foreign key violation -> category_id / org_id does not exist.
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'The chosen category or organisation does not exist.',
      });
    }
    next(err);
  }
});

// ===========================================================================
// PUT /api/events/:id  - ADMIN update an existing event (partial allowed).
// ===========================================================================
router.put('/:id', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric event id is required.',
      });
    }

    const data = readEventBody(req.body);
    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields were provided to update.',
      });
    }
    const errors = validateEvent(data, { partial: true });
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const exists = await query('SELECT event_id FROM events WHERE event_id = ?;', [eventId]);
    if (exists.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No event found with id ${eventId}.`,
      });
    }

    const assignments = Object.keys(data).map((col) => `${col} = ?`).join(', ');
    const sql = `UPDATE events SET ${assignments} WHERE event_id = ?;`;
    await query(sql, [...Object.values(data), eventId]);

    res.json({ success: true, message: 'Event updated successfully.', event_id: eventId });
  } catch (err) {
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'The chosen category or organisation does not exist.',
      });
    }
    next(err);
  }
});

// ===========================================================================
// DELETE /api/events/:id  - ADMIN delete, with data-integrity protection.
// An event that already has registrations CANNOT be deleted.
// ===========================================================================
router.delete('/:id', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric event id is required.',
      });
    }

    const eventRows = await query(
      'SELECT event_name FROM events WHERE event_id = ?;',
      [eventId]
    );
    if (eventRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No event found with id ${eventId}.`,
      });
    }

    const countRows = await query(
      'SELECT COUNT(*) AS reg_count FROM registrations WHERE event_id = ?;',
      [eventId]
    );
    const regCount = Number(countRows[0].reg_count);
    if (regCount > 0) {
      // 409 Conflict: the request conflicts with the current related data.
      return res.status(409).json({
        success: false,
        message: `Cannot delete "${eventRows[0].event_name}" because it already has ${regCount} registration(s). Delete the registrations first.`,
        registration_count: regCount,
      });
    }

    await query('DELETE FROM events WHERE event_id = ?;', [eventId]);
    res.json({ success: true, message: 'Event deleted successfully.', event_id: eventId });
  } catch (err) {
    next(err);
  }
});

// ===========================================================================
// POST /api/events/:id/registrations  - PUBLIC buy ticket(s) for an event.
// Enforces one registration per email per event (DB unique key) and stores
// total_amount = num_tickets * the event's ticket price.
// ===========================================================================
router.post('/:id/registrations', async (req, res, next) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'A valid numeric event id is required.',
      });
    }

    // Only an existing, active event can be registered for.
    const eventRows = await query(
      `SELECT event_id, event_name, event_date, ticket_price, status
       FROM events WHERE event_id = ?;`,
      [eventId]
    );
    if (eventRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No event found with id ${eventId}.`,
      });
    }
    const event = eventRows[0];
    if (event.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This event is suspended and cannot accept registrations.',
      });
    }

    // ---- Validate the submitted registration ---------------------------
    const body = req.body || {};
    const fullName = (body.full_name || '').toString().trim();
    const email = (body.email || '').toString().trim().toLowerCase();
    const phone = (body.phone || '').toString().trim();
    const registrationDate =
      (body.registration_date || '').toString().trim() ||
      new Date().toISOString().slice(0, 10);
    const numTickets = parseInt(body.num_tickets, 10);

    const errors = [];
    if (fullName.length < 2) errors.push('Full name is required.');
    if (!EMAIL_RE.test(email)) errors.push('A valid contact email is required.');
    if (!Number.isInteger(numTickets) || numTickets < 1 || numTickets > 10) {
      errors.push('Number of tickets must be a whole number between 1 and 10.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(registrationDate)) {
      errors.push('Registration date must be in YYYY-MM-DD format.');
    } else if (registrationDate > event.event_date) {
      errors.push('Registration date cannot be after the event date.');
    }
    if (errors.length) {
      return res.status(400).json({ success: false, message: errors.join(' ') });
    }

    const totalAmount = Number(event.ticket_price) * numTickets;

    let result;
    try {
      result = await query(
        `INSERT INTO registrations
           (event_id, full_name, email, phone, registration_date, num_tickets, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [eventId, fullName, email, phone, registrationDate, numTickets, totalAmount]
      );
    } catch (insertErr) {
      // Duplicate key uq_event_email -> same email already registered.
      if (insertErr.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
          success: false,
          message: 'This email address has already registered for this event. Each person may only register once per event.',
        });
      }
      throw insertErr;
    }

    res.status(201).json({
      success: true,
      message: 'Registration completed successfully.',
      data: {
        registration_id: result.insertId,
        event_id: eventId,
        event_name: event.event_name,
        full_name: fullName,
        email,
        phone,
        registration_date: registrationDate,
        num_tickets: numTickets,
        total_amount: totalAmount,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
