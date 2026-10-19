# Charity Events API (PROG2002 Assessment 3)

RESTful API built with **Node.js, Express and MySQL** that serves the charity
events data to both the **client-side website** and the **admin-side website**.

Assessment 3 adds the full **C.R.U.D.** cycle for events, public event
**registration**, an admin listing of every event, and the organisations lookup.

## Setup

1. Install [Node.js](https://nodejs.org) and [MySQL](https://dev.mysql.com/downloads/mysql/).
2. Create the database and sample data by importing the single SQL script in
   MySQL Workbench / phpMyAdmin, or from the command line:

   ```bash
   mysql -u root -p < sql/charityevents_db.sql
   ```

   This creates the database, all tables, the keys/indexes and the sample data
   (11 events, **14 registrations**).

3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env` and enter your MySQL settings:

   ```
   PORT=3000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=charityevents_db
   ```

5. Start the server:

   ```bash
   npm start
   ```

   The API runs on `http://localhost:3000`.

## REST endpoints

| Method | Endpoint | Used by | Description |
|--------|----------|---------|-------------|
| GET    | `/api/events` | client | Active, upcoming events; optional `?date=`, `?location=`, `?category_id=` filters |
| GET    | `/api/events/:id` | client | One active event **plus all its registrations** (newest purchase first) |
| POST   | `/api/events/:id/registrations` | client | Register for an event (validates input; one email per event) |
| GET    | `/api/events/all` | admin | **Every** event regardless of status (active, past, suspended) |
| GET    | `/api/events/all/:id` | admin | Any event (incl. suspended) **plus its registrations** for the Update form |
| POST   | `/api/events` | admin | Create a new event |
| PUT    | `/api/events/:id` | admin | Update an existing event (partial fields allowed) |
| DELETE | `/api/events/:id` | admin | Delete an event **blocked with HTTP 409 if it has registrations** |
| GET    | `/api/categories` | both | Categories for the filter / Create form |
| GET    | `/api/organisations` | admin | Hosting organisations for the Create/Update form |

### Data-integrity rule

An event cannot be deleted while registrations exist. The API returns:

```json
HTTP 409 Conflict
{
  "success": false,
  "message": "Cannot delete \"Spring Community Fun Run\" because it already has 3 registration(s)...",
  "registration_count": 3
}
```

### One registration per person per event

The database enforces a unique key on `(event_id, email)`. A duplicate
registration returns HTTP 409 with a clear message.

## Project structure

```
api/
├── event_db.js          # MySQL connection pool & parameterised query helper
├── server.js            # Express entry point, middleware, routes, error handling
├── package.json
├── .env / .env.example
├── routes/
│   ├── events.js        # list, details, C.R.U.D., registrations
│   ├── categories.js
│   └── organisations.js
├── sql/
│   └── charityevents_db.sql   # schema + data (single export file)
└── test/
    ├── smoke-test.js          # API logic tests (no MySQL required; mock DB)
    └── preview-server.js      # optional mock server to preview the UI offline
```

## Quick logic test (no MySQL needed)

```bash
node test/smoke-test.js
```

This replaces the database with an in-memory mock and asserts the HTTP
status codes, routing order, validation, C.R.U.D. and integrity rules. It does
**not** replace testing against real MySQL — the SQL file must be imported.
