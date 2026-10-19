/**
 * home.js
 * Loads the active, upcoming events from the API and renders them as cards on
 * the Home page. Demonstrates the Promise-based request -> response -> render
 * data flow.
 */
(function () {
  const container = document.getElementById('events-container');

  async function loadEvents() {
    try {
      const response = await fetchJSON('/events');
      renderEventCards(response.data, container);
    } catch (err) {
      container.innerHTML = `
        <div class="empty-message">
          <strong>Could not load events.</strong><br />
          ${err.message}
        </div>`;
    }
  }

  loadEvents();
})();
