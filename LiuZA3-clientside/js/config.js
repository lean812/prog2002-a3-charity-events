/**
 * config.js
 * Central location for the API base URL.
 *
 * The value is chosen automatically:
 *   - When the pages are served on the SCU cPanel domain (scu.edu.au), the API
 *     runs on the same host, so use the relative path '/api'.
 *   - In local development the API runs on a separate port (3000).
 */
(function () {
  const onCpanel = window.location.hostname.indexOf('scu.edu.au') !== -1;
  window.API_CONFIG = {
    BASE_URL: onCpanel ? '/api' : 'http://localhost:3000/api',
  };
})();
