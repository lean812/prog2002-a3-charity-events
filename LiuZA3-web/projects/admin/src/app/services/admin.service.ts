/**
 * admin.service.ts
 * The single Angular service that talks to the admin-facing REST endpoints.
 * The list and detail endpoints under /events/all return every status
 * (active, past, suspended), unlike the public endpoints.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminEvent,
  AdminEventDetail,
  ApiItemResponse,
  ApiListResponse,
  Category,
  EventPayload,
  Organisation,
} from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly baseUrl =
    window.location.hostname.indexOf('scu.edu.au') !== -1
      ? '/api'
      : 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /** Every event (active, past, suspended) for the management table. */
  getAllEvents(): Observable<ApiListResponse<AdminEvent>> {
    return this.http.get<ApiListResponse<AdminEvent>>(`${this.baseUrl}/events/all`);
  }

  /** One event regardless of status, including its registrations. */
  getEvent(id: number | string): Observable<ApiItemResponse<AdminEventDetail>> {
    return this.http.get<ApiItemResponse<AdminEventDetail>>(`${this.baseUrl}/events/all/${id}`);
  }

  getCategories(): Observable<ApiListResponse<Category>> {
    return this.http.get<ApiListResponse<Category>>(`${this.baseUrl}/categories`);
  }

  getOrganisations(): Observable<ApiListResponse<Organisation>> {
    return this.http.get<ApiListResponse<Organisation>>(`${this.baseUrl}/organisations`);
  }

  createEvent(payload: EventPayload): Observable<ApiItemResponse<AdminEvent>> {
    return this.http.post<ApiItemResponse<AdminEvent>>(`${this.baseUrl}/events`, payload);
  }

  updateEvent(id: number, payload: EventPayload): Observable<ApiItemResponse<AdminEvent>> {
    return this.http.put<ApiItemResponse<AdminEvent>>(`${this.baseUrl}/events/${id}`, payload);
  }

  /** Deletes an event. The API rejects with 409 when it has registrations. */
  deleteEvent(id: number): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/events/${id}`);
  }
}
