/**
 * home.component.ts
 * The public landing page. It loads the active, upcoming events from the API
 * through EventService and renders them as cards. The component only holds
 * state (events / loading / error); the actual rendering is declarative.
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EventService } from '../services/event.service';
import { CharityEvent } from '../models';
import { EventCardComponent } from '../components/event-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, EventCardComponent],
  template: `
    <section class="hero">
      <div class="container">
        <h1>Find a charity event you can believe in</h1>
        <p class="lead">
          Browse community fundraisers across Liuzhou, see live weather for the
          event day, and register your tickets in minutes.
        </p>
        <div class="hero-actions">
          <a class="btn btn-amber" routerLink="/search">Search events</a>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <h2 class="section-title">Upcoming events</h2>
        <p class="section-sub">Every active, upcoming event hosted by our partner charities.</p>

        @if (loading) {
          <div class="loading"><div class="spinner"></div> Loading events&hellip;</div>
        } @else if (error) {
          <div class="empty-message"><strong>Could not load events.</strong><br />{{ error }}</div>
        } @else if (events.length === 0) {
          <p class="empty-message">No events to display.</p>
        } @else {
          <div class="events-grid">
            @for (ev of events; track ev.event_id) {
              <app-event-card [event]="ev" />
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  events: CharityEvent[] = [];
  loading = true;
  error = '';

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.eventService.getEvents().subscribe({
      next: (res) => {
        this.events = res.data;
        this.loading = false;
        this.cdr.markForCheck(); // zoneless: notify after async data arrives
      },
      error: (err) => {
        this.error = err?.message || 'Unknown error';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
