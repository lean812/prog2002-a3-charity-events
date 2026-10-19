# Charity Events Client-Side Website (PROG2002 Assessment 3)

The client-side website is built with **plain HTML, CSS and JavaScript** (the
DOM, `fetch` and Promises). It consumes the Charity Events REST API.

## Pages

| File | Page | Features |
|------|------|----------|
| `index.html` | Home | Organisation information and a dynamic list of active, upcoming events |
| `search.html` | Search Events | Filter form (date, location, category), Clear Filters, validation and errors |
| `event.html` | Event Details | Full event info, fundraising progress, **weather forecast**, **list of registrations (newest first)** and a **Register** link to the registration page |
| `register.html` | **Event Registration (new)** | Shows the selected event, a validated form (name, email, phone, date, number of tickets), a live order total, and a confirmation view |

The same navigation menu appears on every page.

## Assessment 3 additions

- **Registration page** (`register.html` / `js/register.js`):
  - receives the event id through the URL query string (`register.html?id=1`)
  - displays the event information (and its weather forecast)
  - client-side validation with `alert()` and an error banner
  - posts to `POST /api/events/:id/registrations`
  - on success shows a confirmation (registration number, total paid) and
    navigation links; on failure shows the server message (e.g. duplicate email)
- **Event details page** now shows every ticket purchase, sorted by the latest
  registration date, and the Register button links to the registration page.
- **Weather (optional bonus)**: the venue's forecast for the event date is read
  from the free Open-Meteo API using the event's latitude/longitude.

## How to run

1. Start the API (see the `api` project) on `http://localhost:3000`.
2. Serve this folder over HTTP (do not use `file://`):

   ```bash
   npx http-server -p 5500
   ```

   Then open `http://localhost:5500/index.html`.
3. If the API runs on a different host/port, edit `js/config.js`.

## Project structure

```
client/
├── index.html
├── search.html
├── event.html
├── register.html        # NEW
├── css/
│   └── style.css
└── js/
    ├── config.js        # API base URL
    ├── common.js        # GET/POST/PUT/DELETE helpers, formatting,
    │                    # cards, modal, HTML escaping, Weather API
    ├── home.js
    ├── search.js
    ├── event.js         # enhanced: registrations list + weather
    └── register.js      # NEW
```
