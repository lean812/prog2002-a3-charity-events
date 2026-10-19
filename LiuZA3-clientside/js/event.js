/**
 * event.js
 * Reads the selected event id from the URL query string (?id=), requests that
 * event's full details (Assessment 3 now includes the registration list and
 * venue coordinates), and renders the detail layout.
 *
 * Assessment 3 additions:
 *   - lists every ticket purchase, newest purchase first
 *   - the Register button links to the new registration page
 *   - an Open-Meteo weather forecast card for the event date
 */
(function () {
  const root = document.getElementById('detail-root');

  // Pick an emoji that matches the WMO weather code returned by Open-Meteo.
  function weatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 2) return '🌤️';
    if (code === 3) return '☁️';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return '🌧️';
    if (code === 95) return '⛈️';
    return '🌡️';
  }

  function renderError(message) {
    root.innerHTML = `
      <div class="container section">
        <div class="empty-message">
          <strong>Event unavailable</strong><br />
          ${esc(message)}<br /><br />
          <a class="btn" href="search.html">Back to Search Events</a>
        </div>
      </div>`;
  }

  // Build the registrations table (newest first, as returned by the API).
  function registrationsHTML(ev) {
    const regs = ev.registrations || [];
    if (!regs.length) {
      return `
        <div class="empty-message">
          No one has registered yet &mdash; be the first to support this cause.
        </div>`;
    }
    const rows = regs
      .map(
        (r) => `
        <tr>
          <td>${esc(r.full_name)}</td>
          <td>${formatDate(r.registration_date)}</td>
          <td class="num">${r.num_tickets}</td>
          <td class="num">${formatPrice(r.total_amount)}</td>
        </tr>`
      )
      .join('');
    return `
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Attendee</th>
              <th>Registered on</th>
              <th>Tickets</th>
              <th>Amount paid</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function render(ev) {
    const colour = categoryColour(ev.category_name);
    const timeRange = ev.start_time
      ? `${formatTime(ev.start_time)}${ev.end_time ? ' &ndash; ' + formatTime(ev.end_time) : ''}`
      : 'TBC';
    const priceLabel =
      Number(ev.ticket_price) === 0
        ? '<span class="free-label">Free entry</span>'
        : '$' + Number(ev.ticket_price).toFixed(2);

    root.innerHTML = `
      <section class="detail-hero" style="background:linear-gradient(120deg, ${colour}, var(--teal-900))">
        <div class="container">
          <span class="tag">${esc(ev.category_name)}</span>
          <h1>${esc(ev.event_name)}</h1>
          <p class="org">Hosted by ${esc(ev.org_name)}</p>
        </div>
      </section>

      <section class="section">
        <div class="container detail-layout">
          <div class="detail-main">
            <h2>About this event</h2>
            <p>${esc(ev.summary)}</p>
            <p>${esc(ev.full_description)}</p>

            <h2>Purpose</h2>
            <p>${esc(ev.org_mission)}</p>

            <h2>Registrations <span class="count-badge">${ev.registration_count}</span></h2>
            <p class="section-sub">
              ${ev.tickets_sold} ticket(s) sold so far. Purchases are shown with
              the most recent registration first.
            </p>
            ${registrationsHTML(ev)}
          </div>

          <aside class="detail-side">
            <ul class="fact-list">
              <li>
                <span class="fact-label">Date</span>
                <span>${formatDate(ev.event_date)}</span>
              </li>
              <li>
                <span class="fact-label">Time</span>
                <span>${timeRange}</span>
              </li>
              <li>
                <span class="fact-label">Venue</span>
                <span>${esc(ev.location_name || 'TBC')}</span>
              </li>
              <li>
                <span class="fact-label">Address</span>
                <span>${esc(ev.address ? ev.address + ', ' : '')}${esc(ev.city || '')}</span>
              </li>
              <li>
                <span class="fact-label">Category</span>
                <span>${esc(ev.category_name)}</span>
              </li>
            </ul>

            <div class="weather-card" id="weather-card" hidden>
              <div class="weather-top">
                <span class="weather-icon" id="weather-icon"></span>
                <div>
                  <p class="weather-title">Event-day forecast</p>
                  <p class="weather-desc" id="weather-desc"></p>
                </div>
              </div>
              <p class="weather-temp" id="weather-temp"></p>
            </div>

            <div class="price-line">${priceLabel}</div>

            <div class="progress-wrap">
              <div class="progress-values">
                <span>Raised: $${Number(ev.raised_amount).toLocaleString()}</span>
                <span>Goal: $${Number(ev.goal_amount).toLocaleString()}</span>
              </div>
              <div class="progress-bar">
                <div class="fill" style="width:${ev.progress_percent}%"></div>
              </div>
              <p class="register-note">${ev.progress_percent}% of the fundraising goal</p>
            </div>

            <a class="btn btn-amber" id="register-btn"
               style="width:100%;display:block"
               href="register.html?id=${ev.event_id}">Register</a>
            <p class="register-note">Your registration is a donation to this cause.</p>
          </aside>
        </div>
      </section>`;
  }

  // Load and, if available, show the forecast for the exact event date.
  async function loadWeather(ev) {
    try {
      const weather = await fetchWeather(ev.latitude, ev.longitude, ev.event_date);
      if (!weather) return;
      const card = document.getElementById('weather-card');
      document.getElementById('weather-icon').textContent = weatherIcon(weather.code);
      document.getElementById('weather-desc').textContent = weather.description;
      document.getElementById('weather-temp').textContent =
        `${weather.min}°C  /  ${weather.max}°C`;
      card.hidden = false;
    } catch (err) {
      // Weather is an optional enhancement; leave the card hidden on failure.
    }
  }

  async function init() {
    const id = getQueryParam('id');

    if (!id || !/^\d+$/.test(id)) {
      renderError('No valid event was selected. Please choose an event from the Home or Search page.');
      return;
    }
    try {
      const res = await fetchJSON('/events/' + id);
      render(res.data);
      loadWeather(res.data);
    } catch (err) {
      renderError(err.message);
    }
  }

  init();
})();
