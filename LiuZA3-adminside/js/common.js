/**
 * common.js
 * Shared helpers used by all pages: API calls (Promises, GET + JSON body
 * methods for C.R.U.D.), date/price formatting, category colours, card
 * rendering, the generic modal, HTML escaping and the external Weather API.
 */

/* ---------- API helpers ------------------------------------------------- */

/**
 * fetchJSON - performs a GET request and parses the JSON response.
 * Returns a Promise that rejects with a clear Error on network or HTTP failure.
 * @param {string} path  path relative to the API base, e.g. '/events'
 * @returns {Promise<any>} parsed response body
 */
async function fetchJSON(path) {
  return requestAPI(path, { method: 'GET' });
}

/**
 * requestAPI - performs any request (GET/POST/PUT/DELETE) and parses JSON.
 * On a non-2xx response it rejects with an Error carrying the server message
 * so the calling page can show it (e.g. a blocked deletion, duplicate email).
 * @param {string} path    path relative to the API base, e.g. '/events/1'
 * @param {object} options { method, body }
 * @returns {Promise<any>} parsed response body
 */
async function requestAPI(path, options = {}) {
  const url = window.API_CONFIG.BASE_URL + path;
  const init = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
  };
  if (options.body !== undefined) init.body = JSON.stringify(options.body);

  let response;
  try {
    response = await fetch(url, init);
  } catch (networkErr) {
    throw new Error(
      'Unable to reach the server. Please make sure the API is running on ' +
        window.API_CONFIG.BASE_URL
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = (body && body.message) || `Request failed (${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

// Convenience wrappers used by the registration and admin pages.
function postJSON(path, body) {
  return requestAPI(path, { method: 'POST', body });
}
function putJSON(path, body) {
  return requestAPI(path, { method: 'PUT', body });
}
function deleteJSON(path) {
  return requestAPI(path, { method: 'DELETE' });
}

/* ---------- Small utilities -------------------------------------------- */

// Read a single query-string parameter, e.g. ?id=5 -> '5'.
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Escape text that came from the user / database before putting it into HTML,
// preventing broken markup and cross-site scripting (XSS).
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- Formatting helpers ----------------------------------------- */

function formatDate(dateStr) {
  if (!dateStr) return 'TBC';
  const d = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const hour = Number(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${ampm}`;
}

function formatPrice(price) {
  const value = Number(price);
  if (value === 0) return 'Free';
  return '$' + value.toFixed(2);
}

// A stable colour per category, used for the card thumbnail and tags
const CATEGORY_COLOURS = {
  'Fun Run': '#2e8b7d',
  'Gala Dinner': '#b8860b',
  'Silent Auction': '#7a5c9e',
  'Charity Concert': '#c0504d',
  'Community Walk': '#4f8a3b',
  'Bake Sale': '#d0873c',
};

function categoryColour(name) {
  return CATEGORY_COLOURS[name] || '#5a7184';
}

/* ---------- Reusable card markup --------------------------------------- */

function eventCardHTML(ev) {
  const colour = categoryColour(ev.category_name);
  const initials = ev.category_name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return `
    <article class="event-card">
      <a class="card-thumb" href="event.html?id=${ev.event_id}"
         style="background:linear-gradient(135deg, ${colour}, ${colour}bb)"
         aria-label="View details of ${esc(ev.event_name)}">
        <span class="thumb-initials">${initials}</span>
        <span class="thumb-category">${esc(ev.category_name)}</span>
      </a>
      <div class="card-body">
        <h3 class="card-title">
          <a href="event.html?id=${ev.event_id}">${esc(ev.event_name)}</a>
        </h3>
        <p class="card-meta">
          <span class="meta-icon" aria-hidden="true">&#128197;</span> ${formatDate(ev.event_date)}
        </p>
        <p class="card-meta">
          <span class="meta-icon" aria-hidden="true">&#128205;</span>
          ${esc(ev.location_name || ev.city)}
        </p>
        <div class="card-footer">
          <span class="ticket-price">${formatPrice(ev.ticket_price)}</span>
          <a class="btn btn-sm" href="event.html?id=${ev.event_id}">View details</a>
        </div>
      </div>
    </article>`;
}

function renderEventCards(events, container) {
  if (!events.length) {
    container.innerHTML =
      '<p class="empty-message">No events to display.</p>';
    return;
  }
  container.innerHTML = events.map(eventCardHTML).join('');
}

/* ---------- External Weather API (Open-Meteo, optional bonus) ---------- */

// WMO weather interpretation codes (the subset used by the brief).
const WEATHER_CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  80: 'Light rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
};

/**
 * fetchWeather - requests the daily forecast for a venue from Open-Meteo and
 * returns the entry for the requested date. Free, no API key, CORS enabled.
 * @returns {Promise<object|null>} { date, description, max, min } or null
 *                                  when the date is outside the forecast range.
 */
async function fetchWeather(latitude, longitude, targetDate) {
  if (latitude === null || latitude === undefined ||
      longitude === null || longitude === undefined) {
    return null;
  }
  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${latitude}&longitude=${longitude}` +
    '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
    '&timezone=auto';

  const res = await fetch(url);
  if (!res.ok) throw new Error('Weather service is temporarily unavailable.');
  const json = await res.json();
  if (!json.daily || !Array.isArray(json.daily.time)) return null;

  const index = json.daily.time.indexOf(targetDate);
  if (index === -1) return null; // forecast not published that far ahead/behind

  const code = json.daily.weather_code[index];
  return {
    date: targetDate,
    code,
    description: WEATHER_CODES[code] || 'Weather data unavailable',
    max: Math.round(json.daily.temperature_2m_max[index]),
    min: Math.round(json.daily.temperature_2m_min[index]),
  };
}

/* ---------- Generic modal ---------------------------------------------- */

function openModal(message) {
  let overlay = document.getElementById('generic-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'generic-modal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" role="dialog" aria-modal="true">
        <p class="modal-message"></p>
        <button type="button" class="btn modal-close">OK</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay || e.target.classList.contains('modal-close')) {
        overlay.classList.remove('show');
      }
    });
  }
  overlay.querySelector('.modal-message').textContent = message;
  overlay.classList.add('show');
}
