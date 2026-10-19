# PROG2002 Assessment 3 — Project Documentation

**Charity Events Management Website** (case study: Heart of Liuzhou Foundation)
Team: _fill in your Team ID and member names_

A complete dynamic website made of **three deployable projects**:

| Project folder | Zip to submit | Role |
|----------------|---------------|------|
| `LiuZA3-api` | `LiuZA3-api.zip` | Node.js + Express + MySQL REST API (server-side) |
| `LiuZA3-clientside` | `LiuZA3-clientside.zip` | Public website (register / browse) |
| `LiuZA3-adminside` | `LiuZA3-adminside.zip` | Staff website (C.R.U.D. on events) |

Tech stack required by the brief and used here: **Node.js, Express, MySQL, HTML,
CSS, JavaScript and the DOM (Promises/fetch)** — no front-end framework.

---

## 1. Database design (Part 1)

The single export file is `LiuZA3-api/sql/charityevents_db.sql` (schema + data).
Run it once to (re)create everything.

### Tables

- **organisations** — the charities that host events.
- **categories** — type of event (Fun Run, Gala Dinner, …).
- **events** — the charity events. Assessment 3 added `latitude` /
  `longitude` so the public pages can call the Open-Meteo Weather API.
- **registrations** — **new table** recording a ticket purchase.

### `registrations` table (key new design)

| Column | Purpose |
|--------|---------|
| `registration_id` | Primary key, auto increment |
| `event_id` | Foreign key → `events.event_id` (which event the user registered for) |
| `full_name`, `email`, `phone` | the attendee's contact details (no USER table, per the brief) |
| `registration_date` | date the tickets were purchased |
| `num_tickets` | how many tickets (1–10, enforced by a CHECK) |
| `total_amount` | `num_tickets × event.ticket_price` |
| `created_at` | server timestamp |

Relationships and integrity:

- Foreign key `registrations.event_id → events.event_id`
  (`ON DELETE RESTRICT`, so a registered event can never be deleted).
- **Unique key `(event_id, email)`** — one email may register for many events
  but only once for the same event.
- Index `(event_id, registration_date)` supports the "newest first" list.

The sample data contains **14 registrations** across several events. Event 8
deliberately has **no** registrations (so an admin delete succeeds), while
events 1 and 2 **do** (so delete is blocked).

`event_db.js` needed no structural change — the connection pool serves all
queries; the new table is handled by the new routes.

---

## 2. REST API design (Part 2)

All queries use **parameterised statements** (`?` placeholders); event writes
go through a fixed white-list of columns, so SQL injection is prevented.

| Method | Endpoint | Notes |
|--------|----------|-------|
| GET | `/api/events` | public list + date/location/category filters |
| GET | `/api/events/:id` | event + its registrations, **newest first** |
| POST | `/api/events/:id/registrations` | public registration; validates, computes total, 409 on duplicate |
| GET | `/api/events/all` | admin: every event with counts |
| GET | `/api/events/all/:id` | admin: any-status event + registrations |
| POST | `/api/events` | create |
| PUT | `/api/events/:id` | update (partial) |
| DELETE | `/api/events/:id` | **409 if registrations exist**, else deletes |
| GET | `/api/categories` | categories |
| GET | `/api/organisations` | organisations (admin form) |

Routing note: the static `/all` and `/all/:id` paths are declared **before**
`/:id` so Express does not treat the word "all" as an event id.

---

## 3. Data flow (explain this in the video)

```
Browser (event.html / register.html / admin)
   │  fetch / Promises (js/common.js)
   ▼
Express routes (routes/events.js)
   │  parameterised SQL via event_db.js (mysql2 pool)
   ▼
MySQL (events, categories, organisations, registrations)
   │  JSON response
   ▼
Browser renders JSON into the DOM
```

Example — registering:
`register.html` reads `?id=1` → `GET /api/events/1` shows the event → the user
submits the form → client validation → `POST /api/events/1/registrations` →
the server validates again, computes `total_amount`, inserts (or returns 409 if
the email is already registered) → the page shows a confirmation.

---

## 4. Run the whole system locally

```bash
# 1) Database (import the SQL file once)
mysql -u root -p < LiuZA3-api/sql/charityevents_db.sql

# 2) API
cd LiuZA3-api
cp .env.example .env      # then edit DB_PASSWORD
npm install
npm start                 # http://localhost:3000

# 3) Client site (another terminal)
cd LiuZA3-clientside
npx http-server -p 5500   # open http://localhost:5500

# 4) Admin site (another terminal)
cd LiuZA3-adminside
npx http-server -p 5600   # open http://localhost:5600
```

No MySQL installed? You can still preview the UI with an in-memory mock:
`node LiuZA3-api/test/preview-server.js` then open
`http://localhost:3000/` (admin: `/admin/`). This is a preview aid only; the
graded version must run against real MySQL.

---

## 5. Deploy to SCU cPanel (Part 5 — each student deploys to their own cPanel)

The exact host names/URLs appear inside your cPanel. The general process is:

1. **Create the database**
   - cPanel → **MySQL® Databases**: create a database (e.g. `cpaneluser_charityevents_db`) and a database user, then **add the user to the database with ALL PRIVILEGES**.
   - cPanel → **phpMyAdmin** → select the database → **Import** → choose
     `sql/charityevents_db.sql` → Go. This creates the tables and data.

2. **Deploy the API (Node.js app)**
   - cPanel → **Setup Node.js App** → **Create Application**.
   - Choose the Node.js version; set the application root (e.g.
     `charity-api`), startup file `server.js`.
   - Upload the contents of `LiuZA3-api` to that folder (File Manager / ZIP).
   - Set the **Environment variables** (same as `.env`):
     `DB_HOST=localhost`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (use the
     cPanel-prefixed names), `PORT` (leave the one cPanel assigns).
   - Click **Run NPM Install**, then **Start App**. Note the API URL cPanel
     gives (e.g. `https://yourhost/~cpaneluser/` or a domain/port).
   - Open `API_URL/` in a browser; you should see the JSON endpoint list.

3. **Deploy the two static sites**
   - Create `public_html/client/` and `public_html/admin/` in File Manager and
     upload the contents of `LiuZA3-clientside` and `LiuZA3-adminside`
     (upload the ZIPs and **Extract** them).
   - In **each** project, open `js/config.js` and set `BASE_URL` to the
     deployed API URL, e.g.
     `BASE_URL: 'https://yourhost/~cpaneluser/api'`
     (match the exact path where the Node app answers; do not keep localhost).

4. **Smoke test on the live server**
   - Client home/search/details should list events; register a test ticket and
     confirm it appears (newest first) on the event page.
   - Admin: create, update, delete an event with no registrations, and confirm
     deleting an event with registrations shows the blocked message.
   - If a page fails to load data, check the browser console and the Node app
     logs (cPanel → Setup Node.js App → log) — almost always a wrong `BASE_URL`
     or a wrong database environment variable.

---

## 6. Demo video plan (≤ 15 minutes)

Answer the brief's three questions, focusing on **your own** changes:

1. **Database & API architecture (plan/design)**
   - Show the ER relationships and the new `registrations` table in the SQL file
     (PK, FK, unique key, check, index).
   - Walk through `routes/events.js`: the details query with registrations, the
     POST/PUT/DELETE handlers and the delete integrity rule.
   - Demonstrate a key endpoint in the browser/Postman (e.g. `GET /api/events/1`,
     `POST /api/events`, and the 409 on delete).
2. **Data flow (API ↔ website)**
   - Show `common.js` request helpers, then a page script (e.g. `register.js`):
     request → response → rendering into the DOM.
3. **Website functionality demo**
   - Client: home, search filters and validation, event page registrations,
     a successful registration and the confirmation, plus a duplicate email.
   - Admin: list (statuses), create, update (with registrations shown), delete
     success vs. blocked delete, and the navigation menu.
   - Optionally point out the Open-Meteo weather card.

---

## 7. GitHub & submission checklist

- [ ] One private team repository containing all three projects; commit
  **incrementally with clear messages** (do not upload everything at once).
- [ ] `.env` and `node_modules/` must **not** be committed (a `.gitignore` is
  included).
- [ ] Both members deployed to their own SCU cPanel and tested the live URLs.
- [ ] Record the video (≤ 15 min), upload it to **SCU OneDrive**, share a link.
- [ ] Each member individually emails the **peer evaluation form** to the tutor
      (title `PROG2002_A3_[Team_ID]_[Member_name]`).
- [ ] Submit: three ZIPs (`LiuZA3-api.zip`, `LiuZA3-clientside.zip`,
      `LiuZA3-adminside.zip`), the GitHub link, the video link, and the form.

Suggested commit sequence: `A2 base import` → `add registrations table & SQL`
→ `event CRUD endpoints` → `registration endpoint` → `registration page`
→ `event page registrations + weather` → `admin list/delete` → `admin form`
→ `README & deployment`.

---

## 8. GenAI declaration

Copy the statement that applies into your submission (the brief requires one).

- **If GenAI was used:**
  > I acknowledge that I have used GenAI tools to complete this assessment. I used <GenAI tool(s)> to <specific purpose(s)> within the parameters outlined in the Assessment Brief and by the Unit Assessor.
- **If GenAI was not used:**
  > I acknowledge that I have not knowingly used GenAI to complete this assessment.

---

### Important academic-integrity note for the team

The brief sets GenAI at **Level 2** and explicitly says GenAI must **not** be
used to generate code that you simply copy and paste. Treat the supplied code as
a **study/teaching base**: read every file, understand each SQL statement and
route, and make sure you can explain and modify it in the video and in any
interview. Change names/details to match your own A2 work, and each member must
genuinely own and be able to explain their part.
