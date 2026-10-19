/**
 * weather.service.ts
 * Calls the external Open-Meteo REST API (a free, no-key, CORS-enabled
 * weather service) and returns the daily forecast for the exact event date.
 * This is the "weather API" integration required by the brief.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WEATHER_CODES } from '../util';
import { WeatherInfo } from '../models';

interface OpenMeteoDaily {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private http: HttpClient) {}

  /**
   * Returns the forecast for targetDate, or null when the coordinates are
   * missing or the date is outside the published forecast range.
   */
  getForecast(
    latitude: number | null | undefined,
    longitude: number | null | undefined,
    targetDate: string
  ): Observable<WeatherInfo | null> {
    if (latitude === null || latitude === undefined ||
        longitude === null || longitude === undefined) {
      return of(null);
    }

    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${latitude}&longitude=${longitude}` +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
      '&timezone=auto';

    return this.http.get<{ daily: OpenMeteoDaily }>(url).pipe(
      map((json) => {
        const daily = json.daily;
        if (!daily || !Array.isArray(daily.time)) return null;
        const index = daily.time.indexOf(targetDate);
        if (index === -1) return null;
        const code = daily.weather_code[index];
        return {
          date: targetDate,
          code,
          description: WEATHER_CODES[code] || 'Weather data unavailable',
          max: Math.round(daily.temperature_2m_max[index]),
          min: Math.round(daily.temperature_2m_min[index]),
        };
      }),
      // Weather is an optional enhancement: never break the page if it fails.
      catchError(() => of(null))
    );
  }
}
