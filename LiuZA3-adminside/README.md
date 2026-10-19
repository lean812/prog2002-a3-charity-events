# Charity Events Admin-Side Website (PROG2002 Assessment 3)

A staff website built with **plain HTML, CSS and JavaScript** (DOM, `fetch` and
Promises). It gives staff full C.R.U.D. control over charity events. No login is
required (authentication is out of scope for this assessment).

## Pages

| File | Page | Features |
|------|------|----------|
| `index.html` | Manage Events | Lists **all** events (active, past, suspended) with status, registration counts and a status filter. Each row has **Edit** and **Delete** actions |
| `event-form.html` | Create / Update Event | Without `?id=` it creates a new event; with `?id=` it pre-fills the event and shows its **associated registrations** |

The same navigation menu (Manage Events / Create Event) appears on every page.

## Features mapped to the brief

- **List**: `GET /api/events/all` — every event regardless of status.
- **New**: the Create form validates required fields, then `POST /api/events`.
- **Update**: the Edit form pre-fills the event and lists its registrations,
  then `PUT /api/events/:id`.
- **Delete**: the Delete button asks for confirmation, calls
  `DELETE /api/events/:id`, and clearly reports the blocked response (HTTP 409)
  when the event already has registrations.
- Categories and hosting organisations are loaded into the form selects.

## How to run

1. Start the API (see the `api` project) on `http://localhost:3000`.
2. Serve this folder over HTTP:

   ```bash
   npx http-server -p 5600
   ```

   Then open `http://localhost:5600/index.html`.
3. If the API runs on a different host/port, edit `js/config.js`.

## Project structure

```
admin/
├── index.html            # Manage Events (list + delete)
├── event-form.html       # Create / Update form
├── css/
│   └── style.css
└── js/
    ├── config.js         # API base URL
    ├── common.js         # shared helpers (GET/POST/PUT/DELETE, formatting)
    ├── admin.js          # list, filter, delete with feedback
    └── form.js           # create / update, validation, registrations
```
