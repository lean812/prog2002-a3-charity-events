/**
 * models.ts
 * TypeScript interfaces that describe the JSON returned by the Node/Express
 * REST API (LiuZA3-api). Typing the API responses is one of the main benefits
 * of using TypeScript + Angular: the compiler checks the property names used
 * across components and services.
 */

/** A single row in the registrations table. */
export interface Registration {
  registration_id: number;
  event_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  registration_date: string; // YYYY-MM-DD
  num_tickets: number;
  total_amount: number;
  /** Present on the POST confirmation response. */
  event_name?: string;
}

/** An event as shown in the list / search cards. */
export interface CharityEvent {
  event_id: number;
  event_name: string;
  summary: string | null;
  full_description: string | null;
  category_id: number;
  category_name: string;
  org_id: number;
  org_name: string;
  org_mission?: string | null;
  event_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ticket_price: number;
  goal_amount: number | null;
  raised_amount: number | null;
  image_url: string | null;
  status: string;
  /** Derived by the API: active / past / suspended. */
  display_status?: string;
}

/** The full detail payload, including the registrations list. */
export interface EventDetail extends CharityEvent {
  registrations: Registration[];
  registration_count: number;
  tickets_sold: number;
  progress_percent: number;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Organisation {
  org_id: number;
  org_name: string;
}

/** Generic API envelope: every endpoint wraps its payload in `data`. */
export interface ApiListResponse<T> {
  data: T[];
  count?: number;
}

export interface ApiItemResponse<T> {
  data: T;
}

/** The body posted to /events/:id/registrations. */
export interface RegistrationPayload {
  full_name: string;
  email: string;
  phone: string;
  num_tickets: number;
  registration_date: string;
}

/** A weather forecast day from the Open-Meteo API. */
export interface WeatherInfo {
  date: string;
  code: number;
  description: string;
  max: number;
  min: number;
}
