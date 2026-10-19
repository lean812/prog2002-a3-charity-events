/**
 * form.js
 * Powers the admin Create / Update event form (Assessment 3).
 *
 *  - without an id in the URL it creates a new event  (POST /api/events)
 *  - with ?id= it loads the event (including suspended ones, via the admin
 *    endpoint /api/events/all/:id), pre-fills the form, shows the event's
 *    registrations, and updates on save (PUT /api/events/:id)
 *
 * Required fields are validated before any request is sent.
 */
(function () {
  const form = document.getElementById('event-form');
  const titleEl = document.getElementById('form-title');
  const saveBtn = document.getElementById('save-btn');
  const errorBanner = document.getElementById('error-banner');
  const categorySelect = document.getElementById('category_id');
  const orgSelect = document.getElementById('org_id');
  const regPanel = document.getElementById('registrations-panel');
  const regSummary = document.getElementById('registrations-summary');
  const regTbody = document.getElementById('registrations-tbody');

  const editId = getQueryParam('id');
  const isEdit = !!editId && /^\d+$/.test(editId);

  // Form controls and the API fields they map to.
  const FIELD_IDS = [
    'event_name', 'summary', 'full_description', 'category_id', 'org_id',
    'event_date', 'start_time', 'end_time', 'location_name', 'address', 'city',
    'latitude', 'longitude', 'ticket_price', 'goal_amount', 'raised_amount',
    'image_url', 'status',
  ];
  const NUMERIC_FIELDS = new Set([
    'latitude', 'longitude', 'ticket_price', 'goal_amount', 'raised_amount',
  ]);

  function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function clearError() {
    errorBanner.textContent = '';
    errorBanner.classList.remove('show');
  }

  async function loadSelectors() {
    try {
      const [cats, orgs] = await Promise.all([
        fetchJSON('/categories'),
        fetchJSON('/organisations'),
      ]);
      categorySelect.innerHTML = '<option value="">— Select category —</option>';
      cats.data.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.category_id;
        opt.textContent = c.category_name;
        categorySelect.appendChild(opt);
      });

      orgSelect.innerHTML = '<option value="">— Select organisation —</option>';
      orgs.data.forEach((o) => {
        const opt = document.createElement('option');
        opt.value = o.org_id;
        opt.textContent = o.org_name;
        orgSelect.appendChild(opt);
      });
    } catch (err) {
      showError('Could not load categories/organisations: ' + err.message);
    }
  }

  function fillForm(ev) {
    FIELD_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el === null) return;
      let value = ev[id];
      if (value === null || value === undefined) value = '';
      el.value = value;
    });
    // time columns come back as "HH:MM:SS"; time inputs need "HH:MM".
    ['start_time', 'end_time'].forEach((id) => {
      const el = document.getElementById(id);
      if (el.value) el.value = el.value.slice(0, 5);
    });
  }

  function renderRegistrations(ev) {
    const regs = ev.registrations || [];
    regPanel.hidden = false;
    regSummary.textContent =
      `${ev.registration_count} registration(s), ${ev.tickets_sold} ticket(s) sold.`;
    if (!regs.length) {
      regTbody.innerHTML =
        '<tr><td colspan="5" class="muted">No registrations yet.</td></tr>';
      return;
    }
    regTbody.innerHTML = regs
      .map(
        (r) => `
        <tr>
          <td>${esc(r.full_name)}</td>
          <td>${esc(r.email)}</td>
          <td>${formatDate(r.registration_date)}</td>
          <td class="num">${r.num_tickets}</td>
          <td class="num">${formatPrice(r.total_amount)}</td>
        </tr>`
      )
      .join('');
  }

  // Gather and validate the form into a plain object ready for the API.
  function collectPayload() {
    const payload = {};
    FIELD_IDS.forEach((id) => {
      let value = document.getElementById(id).value.trim();
      if (NUMERIC_FIELDS.has(id)) {
        payload[id] = value === '' ? null : Number(value);
      } else {
        payload[id] = value === '' ? null : value;
      }
    });
    return payload;
  }

  function validate(p) {
    if (!p.event_name || p.event_name.length < 2) {
      return 'Event name is required.';
    }
    if (!p.category_id) return 'Please choose a category.';
    if (!p.org_id) return 'Please choose the hosting organisation.';
    if (!p.event_date) return 'Event date is required.';
    if (p.ticket_price === null || Number.isNaN(p.ticket_price) || p.ticket_price < 0) {
      return 'Ticket price must be 0 or a positive number.';
    }
    if (p.latitude !== null && (p.latitude < -90 || p.latitude > 90)) {
      return 'Latitude must be between -90 and 90.';
    }
    if (p.longitude !== null && (p.longitude < -180 || p.longitude > 180)) {
      return 'Longitude must be between -180 and 180.';
    }
    ['goal_amount', 'raised_amount'].forEach((id) => {
      if (p[id] !== null && Number.isNaN(p[id])) {
        throw new Error(id + ' must be a number.');
      }
    });
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    clearError();

    let payload;
    try {
      payload = collectPayload();
    } catch (err) {
      window.alert(err.message);
      showError(err.message);
      return;
    }

    const error = validate(payload);
    if (error) {
      window.alert(error);
      showError(error);
      return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      if (isEdit) {
        await putJSON('/events/' + editId, payload);
        openModal('Event updated successfully.');
      } else {
        await postJSON('/events', payload);
        openModal('Event created successfully.');
      }
      window.location.href = 'index.html';
    } catch (err) {
      showError(err.message);
      window.alert(err.message);
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save event';
    }
  }

  async function init() {
    await loadSelectors();
    form.addEventListener('submit', onSubmit);

    if (isEdit) {
      titleEl.textContent = `Edit event #${editId}`;
      saveBtn.textContent = 'Save changes';
      document.querySelector('.nav-menu a[href="event-form.html"]').classList.remove('active');
      try {
        // Admin endpoint returns the event even when suspended, plus registrations.
        const res = await fetchJSON('/events/all/' + editId);
        fillForm(res.data);
        renderRegistrations(res.data);
      } catch (err) {
        form.hidden = true;
        showError(err.message);
      }
    }
  }

  init();
})();
