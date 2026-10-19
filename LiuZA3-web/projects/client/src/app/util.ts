/**
 * util.ts
 * Pure presentation helpers shared by components: a stable colour per event
 * category, the two-letter thumbnail initials, and an emoji that matches a
 * WMO weather code returned by Open-Meteo.
 */

const CATEGORY_COLOURS: Record<string, string> = {
  'Fun Run': '#2e8b7d',
  'Gala Dinner': '#b8860b',
  'Silent Auction': '#7a5c9e',
  'Charity Concert': '#c0504d',
  'Community Walk': '#4f8a3b',
  'Bake Sale': '#d0873c',
};

export function categoryColour(name: string | null | undefined): string {
  return (name && CATEGORY_COLOURS[name]) || '#5a7184';
}

/** Up to two uppercase initials from the category name, e.g. "Fun Run" -> "FR". */
export function categoryInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** Pick an emoji that matches the WMO weather code. */
export function weatherIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code === 45 || code === 48) return '🌫️';
  if (code >= 51 && code <= 55) return '🌦️';
  if ((code >= 61 && code <= 65) || (code >= 80 && code <= 82)) return '🌧️';
  if (code === 95) return '⛈️';
  return '🌡️';
}

/** WMO weather interpretation codes (the subset used by the brief). */
export const WEATHER_CODES: Record<number, string> = {
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

/** Today's date as YYYY-MM-DD (local time). */
export function todayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
