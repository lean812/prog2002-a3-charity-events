/**
 * event-form.component.ts
 * The admin Create / Update event form, built with Angular Reactive Forms.
 *
 *  - without an :id route param it creates a new event  (POST /events)
 *  - with /edit/:id it loads the event through /events/all/:id, pre-fills the
 *    form, shows the event's registrations, and updates on save (PUT /events/:id)
 *
 * Required fields and numeric ranges are validated before any request is sent.
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../services/admin.service';
import {
  AdminEventDetail,
  Category,
  EventPayload,
  Organisation,
} from '../models';
import { EventDatePipe, PricePipe } from '../pipes';

const TEXT_FIELDS = [
  'event_name', 'summary', 'full_description', 'event_date',
  'start_time', 'end_time', 'location_name', 'address', 'city', 'image_url', 'status',
] as const;

const NUMERIC_FIELDS = ['latitude', 'longitude', 'ticket_price', 'goal_amount', 'raised_amount'];

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EventDatePipe, PricePipe],
  template: `
    <section class="section">
      <div class="container admin-form-container">
        <h1 class="section-title">{{ isEdit ? 'Edit event #' + editId : 'Create a new charity event' }}</h1>
        <p class="section-sub">
          Fields marked * are required. Latitude and longitude are used to show the venue
          weather forecast on the public event page.
        </p>

        @if (error) {
          <div class="error-banner show" role="alert">{{ error }}</div>
        }

        @if (event) {
          <div class="registrations-panel">
            <h2>Registrations for this event</h2>
            <p class="section-sub">
              {{ event.registration_count }} registration(s), {{ event.tickets_sold }} ticket(s) sold.
            </p>
            <div class="table-wrap">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Attendee</th><th>Email</th><th>Registered on</th>
                    <th class="num">Tickets</th><th class="num">Amount paid</th>
                  </tr>
                </thead>
                <tbody>
                  @if (event.registrations.length === 0) {
                    <tr><td colspan="5" class="muted">No registrations yet.</td></tr>
                  } @else {
                    @for (r of event.registrations; track r.registration_id) {
                      <tr>
                        <td>{{ r.full_name }}</td>
                        <td>{{ r.email }}</td>
                        <td>{{ r.registration_date | eventDate }}</td>
                        <td class="num">{{ r.num_tickets }}</td>
                        <td class="num">{{ r.total_amount | price }}</td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <form [formGroup]="form" class="admin-form" novalidate>
          <div class="field">
            <label for="event_name">Event name *</label>
            <input type="text" id="event_name" formControlName="event_name" maxlength="200" />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="category_id">Category *</label>
              <select id="category_id" formControlName="category_id">
                <option [ngValue]="null">— Select category —</option>
                @for (c of categories; track c.category_id) {
                  <option [ngValue]="c.category_id">{{ c.category_name }}</option>
                }
              </select>
            </div>
            <div class="field">
              <label for="org_id">Hosting organisation *</label>
              <select id="org_id" formControlName="org_id">
                <option [ngValue]="null">— Select organisation —</option>
                @for (o of organisations; track o.org_id) {
                  <option [ngValue]="o.org_id">{{ o.org_name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="field">
            <label for="summary">Short summary</label>
            <input type="text" id="summary" formControlName="summary" maxlength="300"
                   placeholder="One-line summary shown on the event card" />
          </div>

          <div class="field">
            <label for="full_description">Full description</label>
            <textarea id="full_description" formControlName="full_description" rows="4"></textarea>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="event_date">Event date *</label>
              <input type="date" id="event_date" formControlName="event_date" />
            </div>
            <div class="field">
              <label for="status">Status</label>
              <select id="status" formControlName="status">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="start_time">Start time</label>
              <input type="time" id="start_time" formControlName="start_time" />
            </div>
            <div class="field">
              <label for="end_time">End time</label>
              <input type="time" id="end_time" formControlName="end_time" />
            </div>
          </div>

          <div class="field">
            <label for="location_name">Venue name</label>
            <input type="text" id="location_name" formControlName="location_name" maxlength="150" />
          </div>

          <div class="field-row">
            <div class="field">
              <label for="address">Street address</label>
              <input type="text" id="address" formControlName="address" maxlength="255" />
            </div>
            <div class="field">
              <label for="city">City</label>
              <input type="text" id="city" formControlName="city" maxlength="80" />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="latitude">Latitude</label>
              <input type="number" step="0.000001" id="latitude" formControlName="latitude"
                     placeholder="e.g. 24.3257" />
            </div>
            <div class="field">
              <label for="longitude">Longitude</label>
              <input type="number" step="0.000001" id="longitude" formControlName="longitude"
                     placeholder="e.g. 109.4118" />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="ticket_price">Ticket price *</label>
              <input type="number" step="0.01" min="0" id="ticket_price" formControlName="ticket_price" />
            </div>
            <div class="field">
              <label for="image_url">Image file name</label>
              <input type="text" id="image_url" formControlName="image_url" maxlength="255"
                     placeholder="e.g. funrun.jpg" />
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label for="goal_amount">Fundraising goal</label>
              <input type="number" step="0.01" min="0" id="goal_amount" formControlName="goal_amount" />
            </div>
            <div class="field">
              <label for="raised_amount">Amount raised</label>
              <input type="number" step="0.01" min="0" id="raised_amount" formControlName="raised_amount" />
            </div>
          </div>

          <div class="form-actions-inline">
            <button type="button" class="btn btn-amber" [disabled]="saving" (click)="save()">
              {{ saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Save event') }}
            </button>
            <a class="btn btn-outline" routerLink="/">Cancel</a>
          </div>
        </form>
      </div>
    </section>
  `,
})
export class EventFormComponent implements OnInit {
  form!: FormGroup;
  categories: Category[] = [];
  organisations: Organisation[] = [];
  event: AdminEventDetail | null = null;
  editId: string | null = null;
  isEdit = false;
  error = '';
  saving = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private admin: AdminService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Every field starts as a string; numeric fields are converted on submit.
    this.form = this.fb.group({
      event_name: ['', Validators.required],
      summary: [''],
      full_description: [''],
      category_id: [null, Validators.required],
      org_id: [null, Validators.required],
      event_date: ['', Validators.required],
      start_time: [''],
      end_time: [''],
      location_name: [''],
      address: [''],
      city: [''],
      latitude: [''],
      longitude: [''],
      ticket_price: [0, Validators.required],
      goal_amount: [''],
      raised_amount: [0],
      image_url: [''],
      status: ['active'],
    });

    this.editId = this.route.snapshot.paramMap.get('id');
    this.isEdit = !!this.editId && /^\d+$/.test(this.editId);

    this.admin.getCategories().subscribe((r) => {
      this.categories = r.data;
      this.cdr.markForCheck();
    });
    this.admin.getOrganisations().subscribe((r) => {
      this.organisations = r.data;
      this.cdr.markForCheck();
    });

    if (this.isEdit) {
      this.admin.getEvent(this.editId!).subscribe({
        next: (res) => {
          this.event = res.data;
          this.fillForm(this.event);
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.message || 'Event not found.';
          this.cdr.markForCheck();
        },
      });
    }
  }

  /** Copy API values into the form; time values need "HH:MM". */
  private fillForm(ev: AdminEventDetail): void {
    const patch: Record<string, unknown> = {};
    const src = ev as unknown as Record<string, unknown>;
    for (const key of Object.keys(ev)) {
      const control = this.form.get(key);
      if (control) {
        let value = src[key];
        if (value === null || value === undefined) value = '';
        if (key === 'start_time' || key === 'end_time') {
          value = value ? String(value).slice(0, 5) : '';
        }
        patch[key] = value;
      }
    }
    this.form.patchValue(patch);
  }

  /** Gather and validate the form into the payload the API expects. */
  private collect(): EventPayload | string {
    const v = this.form.value;
    const out: Record<string, unknown> = {};

    TEXT_FIELDS.forEach((key) => {
      const raw = (v[key] ?? '').toString().trim();
      out[key] = raw === '' ? null : raw;
    });
    NUMERIC_FIELDS.forEach((key) => {
      const raw = (v[key] === null || v[key] === undefined ? '' : v[key]).toString().trim();
      out[key] = raw === '' ? null : Number(raw);
    });
    out['category_id'] = v.category_id === null ? null : Number(v.category_id);
    out['org_id'] = v.org_id === null ? null : Number(v.org_id);

    const payload = out as unknown as EventPayload;

    // Validation (mirrors the original admin form).
    if (!payload.event_name || payload.event_name.length < 2) {
      return 'Event name is required.';
    }
    if (!payload.category_id) return 'Please choose a category.';
    if (!payload.org_id) return 'Please choose the hosting organisation.';
    if (!payload.event_date) return 'Event date is required.';
    if (payload.ticket_price === null || Number.isNaN(payload.ticket_price) ||
        payload.ticket_price < 0) {
      return 'Ticket price must be 0 or a positive number.';
    }
    if (payload.latitude !== null && (payload.latitude < -90 || payload.latitude > 90)) {
      return 'Latitude must be between -90 and 90.';
    }
    if (payload.longitude !== null && (payload.longitude < -180 || payload.longitude > 180)) {
      return 'Longitude must be between -180 and 180.';
    }
    for (const key of ['goal_amount', 'raised_amount'] as const) {
      const num = payload[key];
      if (num !== null && Number.isNaN(num)) return key + ' must be a number.';
    }
    return payload;
  }

  save(): void {
    if (this.saving) return;
    this.error = '';

    const result = this.collect();
    if (typeof result === 'string') {
      this.error = result;
      window.alert(result);
      return;
    }

    this.saving = true;
    const request$ = this.isEdit
      ? this.admin.updateEvent(Number(this.editId), result)
      : this.admin.createEvent(result);

    request$.subscribe({
      next: () => {
        window.alert(this.isEdit ? 'Event updated successfully.' : 'Event created successfully.');
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        this.error = err?.message || 'Save failed.';
        window.alert(this.error);
        this.saving = false;
        this.cdr.markForCheck();
      },
    });
  }
}
