/**
 * events-list.component.ts
 * The admin "Manage Events" page. Loads every event through GET /events/all,
 * renders the management table, filters by status on the client, and deletes
 * through DELETE /events/:id — clearly surfacing the 409 integrity error when
 * the event already has registrations.
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../services/admin.service';
import { AdminEvent } from '../models';
import { EventDatePipe, PricePipe } from '../pipes';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [FormsModule, RouterLink, EventDatePipe, PricePipe],
  template: `
    <section class="section">
      <div class="container">
        <div class="admin-page-head">
          <div>
            <h1 class="section-title">Manage charity events</h1>
            <p class="section-sub">
              Every event is listed regardless of status &mdash; active, past or suspended.
              Use the actions to create, edit or remove events.
            </p>
          </div>
          <a class="btn btn-amber" routerLink="/new">+ New event</a>
        </div>

        @if (error) {
          <div class="error-banner show" role="alert">{{ error }}</div>
        }

        <div class="admin-toolbar">
          <label for="status-filter">Filter by status:</label>
          <select id="status-filter" [(ngModel)]="statusFilter" name="statusFilter">
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="past">Past</option>
            <option value="suspended">Suspended</option>
          </select>
          <span class="results-count">{{ filtered.length }} of {{ allEvents.length }} event(s) shown</span>
        </div>

        @if (loading) {
          <div class="loading"><div class="spinner"></div> Loading events&hellip;</div>
        } @else if (filtered.length === 0) {
          <div class="empty-message">No events match this filter.</div>
        } @else {
          <div class="table-wrap">
            <table class="data-table admin-table">
              <thead>
                <tr>
                  <th>ID</th><th>Event</th><th>Category</th><th>Date</th><th>Venue</th>
                  <th class="num">Price</th><th class="num">Registrations</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (ev of filtered; track ev.event_id) {
                  <tr>
                    <td>{{ ev.event_id }}</td>
                    <td>
                      <strong>{{ ev.event_name }}</strong><br />
                      <span class="muted">{{ ev.org_name }}</span>
                    </td>
                    <td>{{ ev.category_name }}</td>
                    <td>{{ ev.event_date | eventDate }}</td>
                    <td>{{ ev.location_name || ev.city || '—' }}</td>
                    <td class="num">{{ ev.ticket_price | price }}</td>
                    <td class="num">
                      {{ ev.registration_count ?? 0 }}
                      <span class="muted">({{ ev.tickets_sold ?? 0 }} tix)</span>
                    </td>
                    <td><span class="pill pill-{{ ev.display_status }}">{{ statusLabel(ev.display_status) }}</span></td>
                    <td class="actions-cell">
                      <a class="btn btn-sm" [routerLink]="['/edit', ev.event_id]">Edit</a>
                      <button type="button" class="btn btn-sm btn-danger"
                              [disabled]="deletingId === ev.event_id"
                              (click)="delete(ev)">
                        {{ deletingId === ev.event_id ? 'Deleting…' : 'Delete' }}
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </section>
  `,
})
export class EventsListComponent implements OnInit {
  allEvents: AdminEvent[] = [];
  statusFilter = 'all';
  loading = true;
  error = '';
  deletingId: number | null = null;

  constructor(
    private admin: AdminService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get filtered(): AdminEvent[] {
    return this.statusFilter === 'all'
      ? this.allEvents
      : this.allEvents.filter((e) => e.display_status === this.statusFilter);
  }

  statusLabel(status: string): string {
    return status === 'active' ? 'Active' : status === 'past' ? 'Past' : 'Suspended';
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.admin.getAllEvents().subscribe({
      next: (res) => {
        this.allEvents = res.data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.message || 'Could not load events.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  delete(ev: AdminEvent): void {
    const confirmed = window.confirm(
      `Delete "${ev.event_name}"?\n\nThis cannot be undone. Deletion will be blocked if the event already has registrations.`
    );
    if (!confirmed) return;

    this.error = '';
    this.deletingId = ev.event_id;
    this.admin.deleteEvent(ev.event_id).subscribe({
      next: () => {
        this.deletingId = null;
        this.cdr.markForCheck();
        window.alert(`"${ev.event_name}" was deleted successfully.`);
        this.load();
      },
      error: (err) => {
        // 409 = integrity protection: registrations exist. Show the exact reason.
        this.error = err?.message || 'Delete failed.';
        window.alert(this.error);
        this.deletingId = null;
        this.cdr.markForCheck();
      },
    });
  }
}
