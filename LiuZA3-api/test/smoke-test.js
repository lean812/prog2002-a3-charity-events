/**
 * test/smoke-test.js
 * ---------------------------------------------------------------------------
 * Logic smoke test for the Assessment 3 API.
 *
 * The grading/deployment database is MySQL on SCU cPanel. This machine may not
 * have a MySQL server installed, so the database module is replaced with an
 * in-memory mock that understands the same queries the routes issue. The
 * Express HTTP layer (routing order, status codes, validation, C.R.U.D. logic,
 * the delete integrity rule and the one-registration-per-email rule) is then
 * exercised end to end over real HTTP requests.
 *
 * Run with:  node test/smoke-test.js
 * NOTE: this does NOT replace testing against real MySQL; it verifies the
 * request/response logic. The SQL file itself must be imported into MySQL.
 * ---------------------------------------------------------------------------
 */
const express = require('express');
const cors = require('cors');

/* ---------- In-memory data (mirrors charityevents_db.sql) -------------- */
const TODAY = '2026-10-18';

const categories = [
  { category_id: 1, category_name: 'Fun Run' },
  { category_id: 2, category_name: 'Gala Dinner' },
  { category_id: 3, category_name: 'Silent Auction' },
];
const organisations = [
  { org_id: 1, org_name: 'Heart of Liuzhou Foundation' },
  { org_id: 2, org_name: 'Riverside Community Care' },
];

function makeEvent(o) {
  return {
    summary: 's', full_description: 'd', start_time: '08:00:00', end_time: '11:30:00',
    location_name: 'Venue', address: '1 Road', city: 'Liuzhou',
    latitude: 24.3, longitude: 109.4, goal_amount: 1000, raised_amount: 100,
    image_url: 'x.jpg', created_at: '2026-10-01 00:00:00',
    status: 'active', ...o,
  };
}
let events = [
  makeEvent({ event_id: 1, event_name: 'Spring Fun Run', category_id: 1, org_id: 1,
              event_date: '2026-10-24', ticket_price: 50 }),
  makeEvent({ event_id: 2, event_name: 'Gala Dinner', category_id: 2, org_id: 1,
              event_date: '2026-11-14', ticket_price: 380 }),
  makeEvent({ event_id: 8, event_name: 'Spring Gala', category_id: 2, org_id: 1,
              event_date: '2027-03-20', ticket_price: 350 }),
  makeEvent({ event_id: 9, event_name: 'Summer Concert', category_id: 4, org_id: 1,
              event_date: '2026-08-15', ticket_price: 80 }),
  makeEvent({ event_id: 11, event_name: 'Citywide Raffle', category_id: 3, org_id: 2,
              event_date: '2026-11-07', ticket_price: 20, status: 'suspended' }),
];
let nextEventId = 12;

let registrations = [
  { registration_id: 1, event_id: 1, full_name: 'Zhang Wei', email: 'zhang.wei@example.com',
    phone: '1', registration_date: '2026-10-10', num_tickets: 2, total_amount: 100 },
  { registration_id: 2, event_id: 1, full_name: 'Chen Lina', email: 'chen.lina@example.com',
    phone: '2', registration_date: '2026-10-12', num_tickets: 1, total_amount: 50 },
  { registration_id: 3, event_id: 1, full_name: 'Huang Jie', email: 'huang.jie@example.com',
    phone: '3', registration_date: '2026-10-16', num_tickets: 3, total_amount: 150 },
];
let nextRegId = 4;

const catName = (id) => (categories.find((c) => c.category_id === id) || {}).category_name || 'Other';
const orgName = (id) => (organisations.find((o) => o.org_id === id) || {}).org_name || 'Org';

function decorate(ev) {
  const regs = registrations.filter((r) => r.event_id === ev.event_id);
  return {
    ...ev,
    category_name: catName(ev.category_id),
    org_name: orgName(ev.org_id),
    org_mission: 'mission',
    registration_count: regs.length,
    tickets_sold: regs.reduce((s, r) => s + r.num_tickets, 0),
  };
}

/* ---------- Mock query() that recognises the route SQL ----------------- */
async function mockQuery(sql, params = []) {
  const s = sql.trim();

  // Categories
  if (s.includes('FROM categories c')) return categories;

  // Organisations
  if (s.includes('FROM organisations o')) {
    return organisations.map((o) => ({ ...o, event_count: 0 }));
  }

  // Public list  (active + upcoming), with optional filters from params
  if (s.startsWith('SELECT') && s.includes('e.status = \'active\'') && s.includes('CURDATE()')) {
    let rows = events
      .filter((e) => e.status === 'active' && e.event_date >= TODAY)
      .map(decorate);
    // date filter
    const dateParam = params.find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p));
    if (dateParam) rows = rows.filter((e) => e.event_date === dateParam);
    // location filter
    const likeParam = params.find((p) => typeof p === 'string' && p.startsWith('%'));
    if (likeParam) {
      const q = likeParam.replace(/%/g, '').toLowerCase();
      rows = rows.filter((e) =>
        [e.city, e.location_name, e.address].some((v) => v.toLowerCase().includes(q)));
    }
    // category filter (query-string values arrive as strings, e.g. "1")
    const numeric = params.filter((p) => /^\d+$/.test(String(p)));
    if (numeric.length) rows = rows.filter((e) => e.category_id === Number(numeric[0]));
    return rows;
  }

  // Admin list of all events (it contains SUM(num_tickets) and DESC ordering)
  if (s.includes('SUM(r.num_tickets)')) return events.map(decorate);

  // Registration count for delete check
  if (s.includes('COUNT(*) AS reg_count')) {
    return [{ reg_count: registrations.filter((r) => r.event_id === params[0]).length }];
  }

  // Event lookup performed inside the registration POST
  if (s.includes('SELECT event_id, event_name, event_date, ticket_price, status')) {
    const ev = events.find((e) => e.event_id === params[0]);
    return ev ? [{ ...ev }] : [];
  }

  // Delete existence check (SELECT event_name)
  if (s.includes('SELECT event_name FROM events')) {
    const ev = events.find((e) => e.event_id === params[0]);
    return ev ? [{ event_name: ev.event_name }] : [];
  }

  // Update existence check (SELECT event_id)
  if (s.includes('SELECT event_id FROM events')) {
    const ev = events.find((e) => e.event_id === params[0]);
    return ev ? [{ event_id: ev.event_id }] : [];
  }

  // Admin single event (no "active" condition in the WHERE clause)
  if (s.includes('SELECT e.*') && s.includes('WHERE e.event_id = ?;')) {
    const ev = events.find((e) => e.event_id === params[0]);
    return ev ? [decorate(ev)] : [];
  }

  // Public single active event
  if (s.includes('WHERE e.event_id = ? AND e.status = \'active\'') ||
      s.includes('e.event_id = ? AND e.status =')) {
    const ev = events.find((e) => e.event_id === params[0] && e.status === 'active');
    return ev ? [decorate(ev)] : [];
  }

  // Registrations list (newest first)
  if (s.includes('FROM registrations') && s.startsWith('SELECT')) {
    return registrations
      .filter((r) => r.event_id === params[0])
      .slice()
      .sort((a, b) =>
        (b.registration_date < a.registration_date ? -1 : 1) ||
        b.registration_id - a.registration_id);
  }

  // Insert event
  if (s.startsWith('INSERT INTO events')) {
    const cols = s.match(/\(([^)]+)\) VALUES/)[1].split(',').map((x) => x.trim());
    const newEvent = makeEvent({ event_id: nextEventId });
    cols.forEach((col, i) => { newEvent[col] = params[i]; });
    newEvent.category_id = Number(newEvent.category_id);
    newEvent.org_id = Number(newEvent.org_id);
    events.push(newEvent);
    nextEventId += 1;
    return { insertId: newEvent.event_id };
  }

  // Insert registration (enforce unique event+email)
  if (s.startsWith('INSERT INTO registrations')) {
    const [event_id, full_name, email, phone, registration_date, num_tickets, total_amount] = params;
    if (registrations.some((r) => r.event_id === event_id && r.email === email)) {
      const err = new Error('Duplicate entry');
      err.code = 'ER_DUP_ENTRY';
      throw err;
    }
    const reg = {
      registration_id: nextRegId, event_id, full_name, email, phone,
      registration_date, num_tickets, total_amount,
    };
    registrations.push(reg);
    nextRegId += 1;
    return { insertId: reg.registration_id };
  }

  // Update event
  if (s.startsWith('UPDATE events')) {
    const id = params[params.length - 1];
    const cols = [...s.matchAll(/(\w+) = \?/g)].map((m) => m[1]);
    const ev = events.find((e) => e.event_id === id);
    if (!ev) return { affectedRows: 0 };
    cols.forEach((col, i) => { ev[col] = params[i]; });
    return { affectedRows: 1 };
  }

  // Delete event
  if (s.startsWith('DELETE FROM events')) {
    events = events.filter((e) => e.event_id !== params[0]);
    return { affectedRows: 1 };
  }

  throw new Error('Mock query did not recognise SQL: ' + s.slice(0, 80));
}

// Replace the database module BEFORE the routers are required so they
// destructure the mocked query().
const db = require('../event_db');
db.query = mockQuery;

const eventsRouter = require('../routes/events');
const categoriesRouter = require('../routes/categories');
const organisationsRouter = require('../routes/organisations');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/events', eventsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/organisations', organisationsRouter);

/* ---------- Tiny test harness ------------------------------------------ */
let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass += 1; console.log('PASS  ' + name); }
  else { fail += 1; console.log('FAIL  ' + name + (detail ? '  -> ' + detail : '')); }
}

async function j(method, path, body) {
  const server = app.listen(0);
  const port = server.address().port;
  const res = await fetch(`http://localhost:${port}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  server.close();
  return { status: res.status, json };
}

(async () => {
  // 1. Public list returns only active upcoming events
  let r = await j('GET', '/api/events');
  check('GET /events is 200', r.status === 200);
  check('GET /events excludes past/suspended',
    r.json.data.every((e) => e.status === 'active' && e.event_date >= TODAY),
    `got ${r.json.count} rows`);

  // 2. Admin /all returns EVERY event including suspended (route order test)
  r = await j('GET', '/api/events/all');
  check('GET /events/all returns an array (not captured by /:id)',
    Array.isArray(r.json.data), JSON.stringify(r.json).slice(0, 60));
  check('GET /events/all includes the suspended event',
    r.json.data.some((e) => e.display_status === 'suspended'));

  // 3. Public detail of active event + registrations sorted newest first
  r = await j('GET', '/api/events/1');
  check('GET /events/1 is 200', r.status === 200);
  check('Event 1 has 3 registrations', r.json.data.registration_count === 3,
    String(r.json.data.registration_count));
  check('Registrations sorted newest first',
    r.json.data.registrations[0].registration_date === '2026-10-16',
    r.json.data.registrations[0].registration_date);

  // 4. Public detail hides suspended event; admin detail shows it
  r = await j('GET', '/api/events/11');
  check('Public GET /events/11 (suspended) is 404', r.status === 404);
  r = await j('GET', '/api/events/all/11');
  check('Admin GET /events/all/11 (suspended) is 200', r.status === 200);

  // 5. Registration: duplicate email rejected
  r = await j('POST', '/api/events/1/registrations', {
    full_name: 'Zhang Wei', email: 'zhang.wei@example.com',
    registration_date: '2026-10-17', num_tickets: 1,
  });
  check('Duplicate registration is 409', r.status === 409, String(r.status));

  // 6. Registration: validation error
  r = await j('POST', '/api/events/1/registrations', {
    full_name: 'X', email: 'not-an-email', num_tickets: 1,
  });
  check('Invalid registration is 400', r.status === 400);

  // 7. Registration: valid new registration
  r = await j('POST', '/api/events/1/registrations', {
    full_name: 'New Person', email: 'new.person@example.com',
    registration_date: '2026-10-17', num_tickets: 2,
  });
  check('Valid registration is 201', r.status === 201, String(r.status));
  check('Server computes total_amount (2 x 50 = 100)',
    r.json.data.total_amount === 100, String(r.json.data.total_amount));

  // 8. Delete blocked when registrations exist
  r = await j('DELETE', '/api/events/1');
  check('Delete event with registrations is 409', r.status === 409, String(r.status));
  check('409 reports registration_count', r.json.registration_count === 4);

  // 9. Delete allowed when no registrations
  r = await j('DELETE', '/api/events/8');
  check('Delete event without registrations is 200', r.status === 200);

  // 10. Create event
  r = await j('POST', '/api/events', {
    event_name: 'New Event', category_id: 1, org_id: 1,
    event_date: '2027-01-01', ticket_price: 10,
  });
  check('Create event is 201', r.status === 201, String(r.status));
  r = await j('POST', '/api/events', { event_name: 'Missing fields' });
  check('Create with missing required fields is 400', r.status === 400);

  // 11. Update event
  r = await j('PUT', '/api/events/2', { event_name: 'Updated Gala' });
  check('Update event is 200', r.status === 200);
  r = await j('GET', '/api/events/all/2');
  check('Update actually changed the name', r.json.data.event_name === 'Updated Gala');

  // 12. Supporting endpoints
  r = await j('GET', '/api/categories');
  check('GET /categories is 200', r.status === 200 && r.json.count >= 3);
  r = await j('GET', '/api/organisations');
  check('GET /organisations is 200', r.status === 200 && r.json.count >= 2);

  // 13. Search category filter
  r = await j('GET', '/api/events?category_id=1');
  check('Search category filter returns only Fun Run',
    r.json.data.every((e) => e.category_id === 1), String(r.json.count));

  // 14. Invalid id shape
  r = await j('GET', '/api/events/abc');
  check('Non-numeric id is 400', r.status === 400);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
