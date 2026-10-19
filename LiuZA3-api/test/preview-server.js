/**
 * Temporary PREVIEW-ONLY server (not part of the submission).
 * Serves the API routes with an in-memory mock DB plus the two static sites,
 * so the rendered pages can be visually checked without a MySQL server.
 *   http://localhost:3000/                  -> client site (home)
 *   http://localhost:3000/event.html?id=1
 *   http://localhost:3000/register.html?id=1
 *   http://localhost:3000/admin/            -> admin site
 * Run from the api folder:  node test/preview-server.js
 */
const path = require('path');
const express = require('express');
const cors = require('cors');

const CLIENT_DIR = path.join(__dirname, '..', '..', 'LiuZA3-clientside');
const ADMIN_DIR = path.join(__dirname, '..', '..', 'LiuZA3-adminside');
const TODAY = '2026-10-18';
const categories = [
  { category_id: 1, category_name: 'Fun Run', description: 'run' },
  { category_id: 2, category_name: 'Gala Dinner', description: 'gala' },
  { category_id: 3, category_name: 'Silent Auction', description: 'auction' },
  { category_id: 4, category_name: 'Charity Concert', description: 'concert' },
  { category_id: 5, category_name: 'Community Walk', description: 'walk' },
  { category_id: 6, category_name: 'Bake Sale', description: 'bake' },
];
const organisations = [
  { org_id: 1, org_name: 'Heart of Liuzhou Foundation', mission: 'community causes' },
  { org_id: 2, org_name: 'Riverside Community Care', mission: 'riverside welfare' },
];
function E(o) {
  return {
    summary: 'A short summary of the event.', full_description: 'A fuller description of the event and the cause it supports.',
    start_time: '08:00:00', end_time: '11:30:00', location_name: 'Liuzhou Sports Center',
    address: 'No. 1 Sports Road', city: 'Liuzhou', latitude: 24.3257, longitude: 109.4118,
    goal_amount: 40000, raised_amount: 12500, image_url: 'x.jpg', status: 'active',
    created_at: '2026-10-01 00:00:00', org_mission: 'We support local causes.',
    org_email: 'a@b.org', org_phone: '1', org_website: 'x', org_address: 'addr', ...o,
  };
}
let events = [
  E({ event_id: 1, event_name: 'Spring Community Fun Run', category_id: 1, org_id: 1, event_date: '2026-10-24', ticket_price: 50 }),
  E({ event_id: 2, event_name: 'Annual Charity Gala Dinner', category_id: 2, org_id: 1, event_date: '2026-11-14', ticket_price: 380, start_time: '18:30:00', end_time: '22:00:00' }),
  E({ event_id: 3, event_name: 'Hope Silent Auction', category_id: 3, org_id: 1, event_date: '2026-11-28', ticket_price: 0 }),
  E({ event_id: 4, event_name: 'Voices for Change Charity Concert', category_id: 4, org_id: 1, event_date: '2026-12-05', ticket_price: 120 }),
  E({ event_id: 5, event_name: 'Winter Warmth Community Walk', category_id: 5, org_id: 2, event_date: '2026-12-19', ticket_price: 30 }),
  E({ event_id: 6, event_name: 'New Year Charity Bake Sale', category_id: 6, org_id: 2, event_date: '2027-01-09', ticket_price: 0 }),
  E({ event_id: 7, event_name: 'Moonlight Fun Run', category_id: 1, org_id: 2, event_date: '2027-02-13', ticket_price: 60 }),
  E({ event_id: 8, event_name: 'Spring Gala for Education', category_id: 2, org_id: 1, event_date: '2027-03-20', ticket_price: 350 }),
  E({ event_id: 9, event_name: 'Summer Charity Concert', category_id: 4, org_id: 1, event_date: '2026-08-15', ticket_price: 80 }),
  E({ event_id: 10, event_name: 'Riverside Walk for Health', category_id: 5, org_id: 2, event_date: '2026-09-12', ticket_price: 25 }),
  E({ event_id: 11, event_name: 'Citywide Charity Raffle', category_id: 3, org_id: 2, event_date: '2026-11-07', ticket_price: 20, status: 'suspended' }),
];
let nextEventId = 12;
let registrations = [
  { registration_id: 1, event_id: 1, full_name: 'Zhang Wei', email: 'zhang.wei@example.com', phone: '1', registration_date: '2026-10-10', num_tickets: 2, total_amount: 100, created_at: 'x' },
  { registration_id: 2, event_id: 1, full_name: 'Chen Lina', email: 'chen.lina@example.com', phone: '2', registration_date: '2026-10-12', num_tickets: 1, total_amount: 50, created_at: 'x' },
  { registration_id: 3, event_id: 1, full_name: 'Huang Jie', email: 'huang.jie@example.com', phone: '3', registration_date: '2026-10-16', num_tickets: 3, total_amount: 150, created_at: 'x' },
  { registration_id: 4, event_id: 2, full_name: 'Liu Yang', email: 'liu.yang@example.com', phone: '4', registration_date: '2026-10-11', num_tickets: 2, total_amount: 760, created_at: 'x' },
  { registration_id: 5, event_id: 2, full_name: 'Wang Fang', email: 'wang.fang@example.com', phone: '5', registration_date: '2026-10-14', num_tickets: 1, total_amount: 380, created_at: 'x' },
  { registration_id: 6, event_id: 2, full_name: 'Zhou Min', email: 'zhou.min@example.com', phone: '6', registration_date: '2026-10-17', num_tickets: 4, total_amount: 1520, created_at: 'x' },
  { registration_id: 7, event_id: 3, full_name: 'Wu Tao', email: 'wu.tao@example.com', phone: '7', registration_date: '2026-10-13', num_tickets: 2, total_amount: 0, created_at: 'x' },
  { registration_id: 8, event_id: 3, full_name: 'Xu Qing', email: 'xu.qing@example.com', phone: '8', registration_date: '2026-10-15', num_tickets: 1, total_amount: 0, created_at: 'x' },
  { registration_id: 9, event_id: 4, full_name: 'Sun Hao', email: 'sun.hao@example.com', phone: '9', registration_date: '2026-10-12', num_tickets: 2, total_amount: 240, created_at: 'x' },
  { registration_id: 10, event_id: 4, full_name: 'Ma Yunxia', email: 'ma.yunxia@example.com', phone: '10', registration_date: '2026-10-17', num_tickets: 3, total_amount: 360, created_at: 'x' },
  { registration_id: 11, event_id: 5, full_name: 'He Jing', email: 'he.jing@example.com', phone: '11', registration_date: '2026-10-16', num_tickets: 2, total_amount: 60, created_at: 'x' },
  { registration_id: 12, event_id: 9, full_name: 'Luo Cheng', email: 'luo.cheng@example.com', phone: '12', registration_date: '2026-07-20', num_tickets: 2, total_amount: 160, created_at: 'x' },
  { registration_id: 13, event_id: 9, full_name: 'Gao Lin', email: 'gao.lin@example.com', phone: '13', registration_date: '2026-07-28', num_tickets: 1, total_amount: 80, created_at: 'x' },
  { registration_id: 14, event_id: 10, full_name: 'Deng Xiaoyu', email: 'deng.xiaoyu@example.com', phone: '14', registration_date: '2026-09-01', num_tickets: 2, total_amount: 50, created_at: 'x' },
];
let nextRegId = 15;
const catName = (id) => (categories.find((c) => c.category_id === id) || {}).category_name || 'Other';
const orgName = (id) => (organisations.find((o) => o.org_id === id) || {}).org_name || 'Org';
function decorate(ev) {
  const regs = registrations.filter((r) => r.event_id === ev.event_id);
  return { ...ev, category_name: catName(ev.category_id), org_name: orgName(ev.org_id),
    registration_count: regs.length, tickets_sold: regs.reduce((s, r) => s + r.num_tickets, 0) };
}

async function query(sql, params = []) {
  const s = sql.trim();
  if (s.includes('FROM categories c')) return categories;
  if (s.includes('FROM organisations o')) return organisations.map((o) => ({ ...o, event_count: 0 }));
  if (s.includes('CURDATE()')) {
    let rows = events.filter((e) => e.status === 'active' && e.event_date >= TODAY).map(decorate);
    const dateP = params.find((p) => /^\d{4}-\d{2}-\d{2}$/.test(p));
    if (dateP) rows = rows.filter((e) => e.event_date === dateP);
    const likeP = params.find((p) => typeof p === 'string' && p.startsWith('%'));
    if (likeP) { const q = likeP.replace(/%/g, '').toLowerCase();
      rows = rows.filter((e) => [e.city, e.location_name, e.address].some((v) => v.toLowerCase().includes(q))); }
    const num = params.filter((p) => /^\d+$/.test(String(p)));
    if (num.length) rows = rows.filter((e) => e.category_id === Number(num[0]));
    return rows;
  }
  if (s.includes('SUM(r.num_tickets)')) return events.map(decorate);
  if (s.includes('COUNT(*) AS reg_count')) return [{ reg_count: registrations.filter((r) => r.event_id === params[0]).length }];
  if (s.includes('SELECT event_id, event_name, event_date, ticket_price, status')) {
    const ev = events.find((e) => e.event_id === params[0]); return ev ? [{ ...ev }] : [];
  }
  if (s.includes('SELECT event_name FROM events') || s.includes('SELECT event_id FROM events')) {
    const ev = events.find((e) => e.event_id === params[0]);
    if (!ev) return [];
    return s.includes('event_name') ? [{ event_name: ev.event_name }] : [{ event_id: ev.event_id }];
  }
  if (s.includes('SELECT e.*') && s.includes('WHERE e.event_id = ?;')) {
    const ev = events.find((e) => e.event_id === params[0]); return ev ? [decorate(ev)] : [];
  }
  if (s.includes('e.status = \'active\'')) {
    const ev = events.find((e) => e.event_id === params[0] && e.status === 'active'); return ev ? [decorate(ev)] : [];
  }
  if (s.includes('FROM registrations') && s.startsWith('SELECT'))
    return registrations.filter((r) => r.event_id === params[0]).slice()
      .sort((a, b) => (b.registration_date < a.registration_date ? -1 : 1) || b.registration_id - a.registration_id);
  if (s.startsWith('INSERT INTO events')) {
    const cols = s.match(/\(([^)]+)\) VALUES/)[1].split(',').map((x) => x.trim());
    const ne = E({ event_id: nextEventId }); cols.forEach((c, i) => { ne[c] = params[i]; });
    events.push(ne); nextEventId += 1; return { insertId: ne.event_id };
  }
  if (s.startsWith('INSERT INTO registrations')) {
    const [event_id, full_name, email, phone, registration_date, num_tickets, total_amount] = params;
    if (registrations.some((r) => r.event_id === event_id && r.email === email)) {
      const err = new Error('dup'); err.code = 'ER_DUP_ENTRY'; throw err;
    }
    const reg = { registration_id: nextRegId, event_id, full_name, email, phone, registration_date, num_tickets, total_amount, created_at: 'x' };
    registrations.push(reg); nextRegId += 1; return { insertId: reg.registration_id };
  }
  if (s.startsWith('UPDATE events')) {
    const id = params[params.length - 1]; const cols = [...s.matchAll(/(\w+) = \?/g)].map((m) => m[1]);
    const ev = events.find((e) => e.event_id === id); if (ev) cols.forEach((c, i) => { ev[c] = params[i]; }); return { affectedRows: 1 };
  }
  if (s.startsWith('DELETE FROM events')) { events = events.filter((e) => e.event_id !== params[0]); return { affectedRows: 1 }; }
  throw new Error('mock: ' + s.slice(0, 60));
}

const db = require('../event_db');
db.query = query;
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/events', require('../routes/events'));
app.use('/api/categories', require('../routes/categories'));
app.use('/api/organisations', require('../routes/organisations'));
app.use('/admin', express.static(ADMIN_DIR));
app.use(express.static(CLIENT_DIR));
app.listen(3000, () => console.log('Preview on http://localhost:3000/  (admin: /admin/)'));
