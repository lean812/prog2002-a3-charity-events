/**
 * models.ts
 * TypeScript interfaces for the admin application's API payloads.
 */

export interface Registration {
  registration_id: number;
  event_id: number;
  full_name: string;
  email: string;
  phone: string | null;
  registration_date: string;
  num_tickets: number;
  total_amount: number;
}

/** An event row in the admin "Manage Events" table (all statuses). */
export interface AdminEvent {
  event_id: number;
  event_name: string;
  summary: string | null;
  full_description: string | null;
  category_id: number;
  category_name: string;
  org_id: number;
  org_name: string;
  org_mission?: string | null;
  event_date: string;
  start_time: string | null;
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
  display_status: 'active' | 'past' | 'suspended';
  registration_count?: number;
  tickets_sold?: number;
}

/** One event with every column and its registrations (admin detail). */
export interface AdminEventDetail extends AdminEvent {
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

export interface ApiListResponse<T> {
  data: T[];
  count?: number;
}

export interface ApiItemResponse<T> {
  data: T;
}

/** The form body sent to POST /events and PUT /events/:id. */
export interface EventPayload {
  event_name: string;
  summary: string | null;
  full_description: string | null;
  category_id: number | null;
  org_id: number | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  ticket_price: number | null;
  goal_amount: number | null;
  raised_amount: number | null;
  image_url: string | null;
  status: string | null;
}
