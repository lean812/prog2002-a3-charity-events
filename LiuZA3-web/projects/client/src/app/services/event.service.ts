/**
 * event.service.ts
 * A single Angular injectable service that wraps every call to the
 * Node/Express REST API. Components ask the service for data and never build
 * URLs themselves, which keeps the HTTP logic in one testable place.
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ApiItemResponse,
  ApiListResponse,
  Category,
  CharityEvent,
  EventDetail,
  Registration,
  RegistrationPayload,
} from '../models';

@Injectable({ providedIn: 'root' })
export class EventService {
  /** On the SCU cPanel the API is served from the same host under /api. */
  private readonly baseUrl =
    window.location.hostname.indexOf('scu.edu.au') !== -1
      ? '/api'
      : 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /** Active, upcoming events, optionally filtered by date/location/category. */
  getEvents(filters: { date?: string; location?: string; category_id?: string | number } = {}):
    Observable<ApiListResponse<CharityEvent>> {
    let params = new HttpParams();
    if (filters.date) params = params.set('date', filters.date);
    if (filters.location) params = params.set('location', filters.location);
    if (filters.category_id) params = params.set('category_id', filters.category_id);
    return this.http.get<ApiListResponse<CharityEvent>>(`${this.baseUrl}/events`, { params });
  }

  /** Full detail of one event, including its registrations list. */
  getEvent(id: number | string): Observable<ApiItemResponse<EventDetail>> {
    return this.http.get<ApiItemResponse<EventDetail>>(`${this.baseUrl}/events/${id}`);
  }

  /** All categories, used to populate the search dropdown. */
  getCategories(): Observable<ApiListResponse<Category>> {
    return this.http.get<ApiListResponse<Category>>(`${this.baseUrl}/categories`);
  }

  /** Submit a registration. The API returns 409 if the email is already registered. */
  register(id: number, payload: RegistrationPayload):
    Observable<ApiItemResponse<Registration>> {
    return this.http.post<ApiItemResponse<Registration>>(
      `${this.baseUrl}/events/${id}/registrations`,
      payload
    );
  }
}
