/**
 * admin.js
 * Powers the admin "Manage Events" page (Assessment 3).
 *
 *  - loads EVERY event through GET /api/events/all (active, past, suspended)
 *  - renders an administrative table with status, registration counts and
 *    Edit / Delete actions
 *  - performs a client-side status filter
 *  - deletes through DELETE /api/events/:id, clearly reporting the blocked
 *    response (HTTP 409) when the event already has registrations
 */
(function () {
  const tbody = document.getElementById('events-tbody');
  const resultsCount = document.getElementById('results-count');
  const errorBanner = document.getElementById('error-banner');
  const statusFilter = document.getElementById('status-filter');

  let allEvents = [];

  function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
  }
  function clearError() {
    errorBanner.textContent = '';
    errorBanner.classList.remove('show');
  }

  function statusPill(status) {
    const label =
      status === 'active' ? 'Active'
      : status === 'past' ? 'Past'
      : 'Suspended';
    return `<span class="pill pill-${esc(status)}">${label}</span>`;
  }

  function rowHTML(ev) {
    return `
      <tr data-status="${esc(ev.display_status)}">
        <td>${ev.event_id}</td>
        <td>
          <strong>${esc(ev.event_name)}</strong><br />
          <span class="muted">${esc(ev.org_name)}</span>
        </td>
        <td>${esc(ev.category_name)}</td>
        <td>${formatDate(ev.event_date)}</td>
        <td>${esc(ev.location_name || ev.city || '—')}</td>
        <td class="num">${formatPrice(ev.ticket_price)}</td>
        <td class="num">
          ${ev.registration_count}
          <span class="muted">(${ev.tickets_sold} tix)</span>
        </td>
        <td>${statusPill(ev.display_status)}</td>
        <td class="actions-cell">
          <a class="btn btn-sm" href="event-form.html?id=${ev.event_id}">Edit</a>
          <button type="button" class="btn btn-sm btn-danger"
                  data-delete="${ev.event_id}" data-name="${esc(ev.event_name)}">
            Delete
          </button>
        </td>
      </tr>`;
  }

  function render() {
    const filter = statusFilter.value;
    const events =
      filter === 'all'
        ? allEvents
        : allEvents.filter((ev) => ev.display_status === filter);

    if (!events.length) {
      tbody.innerHTML =
        '<tr><td colspan="9"><div class="empty-message">No events match this filter.</div></td></tr>';
    } else {
      tbody.innerHTML = events.map(rowHTML).join('');
    }
    resultsCount.textContent = `${events.length} of ${allEvents.length} event(s) shown`;
  }

  async function loadEvents() {
    clearError();
    tbody.innerHTML = `
      <tr><td colspan="9">
        <div class="loading"><div class="spinner"></div> Loading events&hellip;</div>
      </td></tr>`;
    try {
      const res = await fetchJSON('/events/all');
      allEvents = res.data;
      render();
    } catch (err) {
      tbody.innerHTML =
        '<tr><td colspan="9"><div class="empty-message">Could not load events.</div></td></tr>';
      showError(err.message);
    }
  }

  // Event delegation for the Delete buttons.
  tbody.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-delete]');
    if (!btn) return;
    clearError();

    const id = btn.dataset.delete;
    const name = btn.dataset.name;
    const confirmed = window.confirm(
      `Delete "${name}"?\n\nThis cannot be undone. Deletion will be blocked if the event already has registrations.`
    );
    if (!confirmed) return;

    btn.disabled = true;
    btn.textContent = 'Deleting…';
    try {
      await deleteJSON('/events/' + id);
      await loadEvents();
      openModal(`"${name}" was deleted successfully.`);
    } catch (err) {
      // 409 = integrity protection (registrations exist); show the exact reason.
      showError(err.message);
      window.alert(err.message);
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  });

  statusFilter.addEventListener('change', render);

  loadEvents();
})();
