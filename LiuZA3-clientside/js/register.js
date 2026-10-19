/**
 * register.js
 * Powers the new Event Registration page (Assessment 3).
 *
 *  1. Reads the event id from the URL (?id=), fetches the event from the API
 *     and displays it so the user knows what they are registering for.
 *  2. Validates the form on the client (name, email, date range, tickets).
 *  3. POSTs the registration to /api/events/:id/registrations.
 *  4. On success shows a confirmation with the total paid; on failure (e.g.
 *     duplicate email) shows the server's message.
 *
 * The event id is passed between pages with a URL query string, as suggested
 * in the brief.
 */
(function () {
  const banner = document.getElementById('event-banner');
  const side = document.getElementById('register-side');
  const form = document.getElementById('registration-form');
  const errorBanner = document.getElementById('error-banner');
  const dateInput = document.getElementById('registration_date');
  const ticketsSelect = document.getElementById('num_tickets');
  const unitPriceEl = document.getElementById('unit-price');
  const summaryQtyEl = document.getElementById('summary-qty');
  const totalAmountEl = document.getElementById('total-amount');
  const submitBtn = document.getElementById('submit-btn');
  const confirmation = document.getElementById('confirmation');
  const confirmBox = document.getElementById('confirm-box');

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let currentEvent = null;

  function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function clearError() {
    errorBanner.textContent = '';
    errorBanner.classList.remove('show');
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

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

  // Render the event summary banner and the side information card.
  function renderEvent(ev) {
    const colour = categoryColour(ev.category_name);
    document.getElementById('cancel-link').href = `event.html?id=${ev.event_id}`;

    banner.innerHTML = `
      <section class="detail-hero" style="background:linear-gradient(120deg, ${colour}, var(--teal-900))">
        <div class="container">
          <span class="tag">${esc(ev.category_name)}</span>
          <h1>${esc(ev.event_name)}</h1>
          <p class="org">
            ${formatDate(ev.event_date)} &middot;
            ${esc(ev.location_name || ev.city || 'Venue to be confirmed')}
          </p>
        </div>
      </section>`;

    side.innerHTML = `
      <div class="detail-side register-info">
        <h2>Event information</h2>
        <ul class="fact-list">
          <li><span class="fact-label">Hosted by</span><span>${esc(ev.org_name)}</span></li>
          <li><span class="fact-label">Date</span><span>${formatDate(ev.event_date)}</span></li>
          <li><span class="fact-label">Time</span><span>${
            ev.start_time ? formatTime(ev.start_time) + (ev.end_time ? ' &ndash; ' + formatTime(ev.end_time) : '') : 'TBC'
          }</span></li>
          <li><span class="fact-label">Venue</span><span>${esc(ev.location_name || 'TBC')}</span></li>
          <li><span class="fact-label">Address</span><span>${esc(ev.address ? ev.address + ', ' : '')}${esc(ev.city || '')}</span></li>
          <li><span class="fact-label">Ticket</span><span>${formatPrice(ev.ticket_price)}</span></li>
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
        <p class="register-note">${esc(ev.summary)}</p>
      </div>`;
  }

  async function loadWeather(ev) {
    try {
      const weather = await fetchWeather(ev.latitude, ev.longitude, ev.event_date);
      if (!weather) return;
      const card = side.querySelector('#weather-card');
      side.querySelector('#weather-icon').textContent = weatherIcon(weather.code);
      side.querySelector('#weather-desc').textContent = weather.description;
      side.querySelector('#weather-temp').textContent = `${weather.min}°C  /  ${weather.max}°C`;
      card.hidden = false;
    } catch (err) {
      // weather is optional
    }
  }

  // Keep the order summary in sync with the selected number of tickets.
  function updateOrderSummary() {
    if (!currentEvent) return;
    const qty = Number(ticketsSelect.value);
    const price = Number(currentEvent.ticket_price);
    unitPriceEl.textContent = formatPrice(price);
    summaryQtyEl.textContent = qty;
    totalAmountEl.textContent = formatPrice(price * qty);
  }

  // Client-side validation; returns an error message string or '' when valid.
  function validateForm() {
    const fullName = form.full_name.value.trim();
    const email = form.email.value.trim();
    const qty = Number(ticketsSelect.value);

    if (fullName.length < 2) return 'Please enter your full name.';
    if (!EMAIL_RE.test(email)) return 'Please enter a valid contact email address.';
    if (!dateInput.value) return 'Please choose the registration date.';
    if (dateInput.value < todayISO()) {
      return 'Registration date cannot be in the past.';
    }
    if (currentEvent && dateInput.value > currentEvent.event_date) {
      return 'Registration date cannot be after the event date.';
    }
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return 'Please choose between 1 and 10 tickets.';
    }
    return '';
  }

  function renderConfirmation(reg) {
    form.closest('.register-panel').hidden = true;
    side.hidden = true;
    confirmation.hidden = false;
    confirmBox.innerHTML = `
      <div class="confirm-icon" aria-hidden="true">&#9989;</div>
      <h2>Registration confirmed!</h2>
      <p>Thank you, <strong>${esc(reg.full_name)}</strong>. Your registration for
         <strong>${esc(reg.event_name)}</strong> has been received.</p>
      <div class="table-wrap">
        <table class="data-table">
          <tbody>
            <tr><th>Registration number</th><td>#${reg.registration_id}</td></tr>
            <tr><th>Registration date</th><td>${formatDate(reg.registration_date)}</td></tr>
            <tr><th>Contact email</th><td>${esc(reg.email)}</td></tr>
            <tr><th>Tickets</th><td>${reg.num_tickets}</td></tr>
            <tr><th>Total amount paid</th><td>${formatPrice(reg.total_amount)}</td></tr>
          </tbody>
        </table>
      </div>
      <p class="register-note">A confirmation has been recorded for this registration.
         Each person may only register once per event.</p>
      <div class="form-actions-inline" style="justify-content:center;margin-top:1.4rem">
        <a class="btn btn-amber" href="event.html?id=${reg.event_id}">View event details</a>
        <a class="btn btn-outline" href="search.html">Browse more events</a>
      </div>`;
    confirmation.scrollIntoView({ behavior: 'smooth' });
  }

  async function onSubmit(e) {
    e.preventDefault();
    clearError();

    const error = validateForm();
    if (error) {
      // Required client-side alert when validation fails.
      window.alert(error);
      showError(error);
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting…';

    const payload = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      registration_date: dateInput.value,
      num_tickets: Number(ticketsSelect.value),
    };

    try {
      const res = await postJSON(
        `/events/${currentEvent.event_id}/registrations`,
        payload
      );
      renderConfirmation(res.data);
    } catch (err) {
      // Covers the 409 "already registered" and validation errors from the API.
      showError(err.message);
      window.alert(err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Complete registration';
    }
  }

  async function init() {
    const id = getQueryParam('id');
    if (!id || !/^\d+$/.test(id)) {
      banner.innerHTML = '';
      side.innerHTML = '';
      showError('No valid event was selected. Please choose an event first.');
      return;
    }

    try {
      const res = await fetchJSON('/events/' + id);
      currentEvent = res.data;
      renderEvent(currentEvent);
      loadWeather(currentEvent);

      // Default the registration date to today and constrain the picker.
      dateInput.value = todayISO();
      dateInput.min = todayISO();
      dateInput.max = currentEvent.event_date;

      updateOrderSummary();
      ticketsSelect.addEventListener('change', updateOrderSummary);
      form.addEventListener('submit', onSubmit);
    } catch (err) {
      banner.innerHTML = '';
      side.innerHTML = '';
      form.closest('.register-panel').hidden = true;
      showError(err.message);
    }
  }

  init();
})();
