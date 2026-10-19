/**
 * event-detail.component.ts
 * The Event Details page. Reads the event id from the route parameter
 * (routerLink "/event/:id"), requests the full detail including the
 * registrations list, and shows the Open-Meteo forecast for the event date.
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../services/event.service';
import { WeatherService } from '../services/weather.service';
import { EventDetail, WeatherInfo } from '../models';
import { categoryColour, weatherIcon } from '../util';
import { EventDatePipe, EventTimePipe, MoneyPipe, PricePipe } from '../pipes';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [RouterLink, EventDatePipe, EventTimePipe, MoneyPipe, PricePipe],
  template: `
    @if (error) {
      <section class="section">
        <div class="container">
          <div class="empty-message">
            <strong>Event unavailable</strong><br />{{ error }}<br /><br />
            <a class="btn" routerLink="/search">Back to Search Events</a>
          </div>
        </div>
      </section>
    } @else if (!event) {
      <section class="section">
        <div class="container"><div class="loading"><div class="spinner"></div> Loading&hellip;</div></div>
      </section>
    } @else {
      <section class="detail-hero"
               [style.background]="'linear-gradient(120deg,' + colour + ',var(--teal-900))'">
        <div class="container">
          <span class="tag">{{ event.category_name }}</span>
          <h1>{{ event.event_name }}</h1>
          <p class="org">Hosted by {{ event.org_name }}</p>
        </div>
      </section>

      <section class="section">
        <div class="container detail-layout">
          <div class="detail-main">
            <h2>About this event</h2>
            <p>{{ event.summary }}</p>
            <p>{{ event.full_description }}</p>

            <h2>Purpose</h2>
            <p>{{ event.org_mission }}</p>

            <h2>Registrations <span class="count-badge">{{ event.registration_count }}</span></h2>
            <p class="section-sub">
              {{ event.tickets_sold }} ticket(s) sold so far. Purchases are shown with the
              most recent registration first.
            </p>

            @if (event.registrations.length === 0) {
              <div class="empty-message">
                No one has registered yet &mdash; be the first to support this cause.
              </div>
            } @else {
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Attendee</th><th>Registered on</th><th>Tickets</th><th>Amount paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of event.registrations; track r.registration_id) {
                      <tr>
                        <td>{{ r.full_name }}</td>
                        <td>{{ r.registration_date | eventDate }}</td>
                        <td class="num">{{ r.num_tickets }}</td>
                        <td class="num">{{ r.total_amount | price }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>

          <aside class="detail-side">
            <ul class="fact-list">
              <li><span class="fact-label">Date</span><span>{{ event.event_date | eventDate }}</span></li>
              <li>
                <span class="fact-label">Time</span>
                <span>
                  @if (event.start_time) {
                    {{ event.start_time | eventTime }}
                    @if (event.end_time) { &ndash; {{ event.end_time | eventTime }} }
                  } @else { TBC }
                </span>
              </li>
              <li><span class="fact-label">Venue</span><span>{{ event.location_name || 'TBC' }}</span></li>
              <li><span class="fact-label">Address</span>
                <span>{{ event.address ? event.address + ', ' : '' }}{{ event.city || '' }}</span></li>
              <li><span class="fact-label">Category</span><span>{{ event.category_name }}</span></li>
            </ul>

            @if (weather) {
              <div class="weather-card">
                <div class="weather-top">
                  <span class="weather-icon">{{ weatherIcon(weather.code) }}</span>
                  <div>
                    <p class="weather-title">Event-day forecast</p>
                    <p class="weather-desc">{{ weather.description }}</p>
                  </div>
                </div>
                <p class="weather-temp">{{ weather.min }}°C / {{ weather.max }}°C</p>
              </div>
            }

            <div class="price-line">
              @if (event.ticket_price === 0) {
                <span class="free-label">Free entry</span>
              } @else {
                {{ event.ticket_price | price }}
              }
            </div>

            <div class="progress-wrap">
              <div class="progress-values">
                <span>Raised: &#36;{{ event.raised_amount | money }}</span>
                <span>Goal: &#36;{{ event.goal_amount | money }}</span>
              </div>
              <div class="progress-bar">
                <div class="fill" [style.width.%]="event.progress_percent"></div>
              </div>
              <p class="register-note">{{ event.progress_percent }}% of the fundraising goal</p>
            </div>

            <a class="btn btn-amber" style="width:100%;display:block"
               [routerLink]="['/register', event.event_id]">Register</a>
            <p class="register-note">Your registration is a donation to this cause.</p>
          </aside>
        </div>
      </section>
    }
  `,
})
export class EventDetailComponent implements OnInit {
  event: EventDetail | null = null;
  weather: WeatherInfo | null = null;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService,
    private weatherService: WeatherService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^\d+$/.test(id)) {
      this.error = 'No valid event was selected. Please choose an event from the Home or Search page.';
      return;
    }

    this.eventService.getEvent(id).subscribe({
      next: (res) => {
        this.event = res.data;
        this.cdr.markForCheck();
        this.loadWeather();
      },
      error: (err) => {
        this.error = err?.message || 'Event not found.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadWeather(): void {
    if (!this.event) return;
    this.weatherService
      .getForecast(this.event.latitude, this.event.longitude, this.event.event_date)
      .subscribe((w) => {
        this.weather = w;
        this.cdr.markForCheck();
      });
  }

  get colour(): string {
    return this.event ? categoryColour(this.event.category_name) : '#5a7184';
  }

  weatherIcon = weatherIcon;
}
