/**
 * search.js
 * Powers the Search Events page: populates the category dropdown, builds the
 * query string from the form, calls the API with the selected criteria, and
 * renders the matching events. Includes Clear Filters and error handling via
 * DOM manipulation.
 */
(function () {
  const form = document.getElementById('search-form');
  const dateInput = document.getElementById('filter-date');
  const locationInput = document.getElementById('filter-location');
  const categorySelect = document.getElementById('filter-category');
  const clearBtn = document.getElementById('clear-filters');
  const resultsContainer = document.getElementById('results-container');
  const resultsCount = document.getElementById('results-count');
  const errorBanner = document.getElementById('error-banner');

  function showError(message) {
    errorBanner.textContent = message;
    errorBanner.classList.add('show');
  }
  function clearError() {
    errorBanner.textContent = '';
    errorBanner.classList.remove('show');
  }

  // Load categories into the dropdown
  async function loadCategories() {
    try {
      const res = await fetchJSON('/categories');
      res.data.forEach((cat) => {
        const option = document.createElement('option');
        option.value = cat.category_id;
        option.textContent = cat.category_name;
        categorySelect.appendChild(option);
      });
    } catch (err) {
      showError('Could not load categories: ' + err.message);
    }
  }

  // Run a search using the current form values
  async function runSearch(params) {
    clearError();
    resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner" aria-hidden="true"></div>
        Searching&hellip;
      </div>`;
    resultsCount.textContent = '';

    try {
      const queryString = params.toString() ? '?' + params.toString() : '';
      const res = await fetchJSON('/events' + queryString);
      renderEventCards(res.data, resultsContainer);
      resultsCount.textContent = `${res.count} event${
        res.count === 1 ? '' : 's'
      } found`;
    } catch (err) {
      resultsContainer.innerHTML = '';
      showError(err.message);
    }
  }

  // Build the URLSearchParams from the form, ignoring empty fields
  function buildParams() {
    const params = new URLSearchParams();
    if (dateInput.value) params.set('date', dateInput.value);
    if (locationInput.value.trim()) params.set('location', locationInput.value.trim());
    if (categorySelect.value) params.set('category_id', categorySelect.value);
    return params;
  }

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // Basic validation: a date in the past cannot return upcoming events
    if (dateInput.value) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const chosen = new Date(dateInput.value + 'T00:00:00');
      if (chosen < today) {
        showError('Please choose today or a future date; past events are not open for registration.');
        return;
      }
    }
    runSearch(buildParams());
  });

  // Clear Filters: reset the form (DOM manipulation) and reload all events
  clearBtn.addEventListener('click', () => {
    form.reset();
    clearError();
    runSearch(new URLSearchParams());
  });

  // Initial page load: categories + all upcoming events
  loadCategories();
  runSearch(new URLSearchParams());
})();
