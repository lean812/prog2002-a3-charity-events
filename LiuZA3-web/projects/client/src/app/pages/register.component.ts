/**
 * register.component.ts
 * The Event Registration page. Built with Angular Reactive Forms
 * (FormBuilder + Validators): the form is a typed object in the component,
 * validation runs in the browser, and the order summary is computed with
 * reactive getters. On submit it POSTs to the API and shows the confirmation.
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EventService } from '../services/event.service';
import { WeatherService } from '../services/weather.service';
import { EventDetail, Registration, WeatherInfo } from '../models';
import { categoryColour, todayISO, weatherIcon } from '../util';
import { EventDatePipe, EventTimePipe, PricePipe } from '../pipes';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    EventDatePipe, EventTimePipe, PricePipe],
  template: `
    @if (event) {
      <section class="detail-hero"
               [style.background]="'linear-gradient(120deg,' + colour + ',var(--teal-900))'">
        <div class="container">
          <span class="tag">{{ event.category_name }}</span>
          <h1>{{ event.event_name }}</h1>
          <p class="org">
            {{ event.event_date | eventDate }} &middot;
            {{ event.location_name || event.city || 'Venue to be confirmed' }}
          </p>
        </div>
      </section>
    }

    @if (confirmation) {
      <section class="section">
        <div class="container">
          <div class="confirm-box">
            <div class="confirm-icon" aria-hidden="true">&#9989;</div>
            <h2>Registration confirmed!</h2>
            <p>Thank you, <strong>{{ confirmation.full_name }}</strong>. Your registration for
               <strong>{{ confirmation.event_name }}</strong> has been received.</p>
            <div class="table-wrap">
              <table class="data-table">
                <tbody>
                  <tr><th>Registration number</th><td>#{{ confirmation.registration_id }}</td></tr>
                  <tr><th>Registration date</th><td>{{ confirmation.registration_date | eventDate }}</td></tr>
                  <tr><th>Contact email</th><td>{{ confirmation.email }}</td></tr>
                  <tr><th>Tickets</th><td>{{ confirmation.num_tickets }}</td></tr>
                  <tr><th>Total amount paid</th><td>{{ confirmation.total_amount | price }}</td></tr>
                </tbody>
              </table>
            </div>
            <p class="register-note">A confirmation has been recorded. Each person may only
               register once per event.</p>
            <div class="form-actions-inline" style="justify-content:center;margin-top:1.4rem">
              <a class="btn btn-amber" [routerLink]="['/event', confirmation.event_id]">View event details</a>
              <a class="btn btn-outline" routerLink="/search">Browse more events</a>
            </div>
          </div>
        </div>
      </section>
    } @else if (event) {
      <section class="section">
        <div class="container register-layout">
          <div class="register-panel">
            <h1 class="section-title">Register for this event</h1>
            <p class="section-sub">
              Fill in your contact details and choose how many tickets you want to purchase.
              Each person may only register once per event.
            </p>

            @if (error) {
              <div class="error-banner show" role="alert">{{ error }}</div>
            }

            <form [formGroup]="form" novalidate>
              <div class="field">
                <label for="full_name">Full name *</label>
                <input id="full_name" type="text" formControlName="full_name" maxlength="120"
                       placeholder="e.g. Zhang Wei" />
              </div>
              <div class="field">
                <label for="email">Contact email *</label>
                <input id="email" type="email" formControlName="email" maxlength="120"
                       placeholder="e.g. zhang.wei@example.com" />
              </div>
              <div class="field">
                <label for="phone">Phone number</label>
                <input id="phone" type="tel" formControlName="phone" maxlength="30"
                       placeholder="e.g. +86 138 0000 0000 (optional)" />
              </div>

              <div class="field-row">
                <div class="field">
                  <label for="registration_date">Registration date *</label>
                  <input id="registration_date" type="date" formControlName="registration_date"
                         [min]="today" [max]="event.event_date" />
                </div>
                <div class="field">
                  <label for="num_tickets">Number of tickets *</label>
                  <select id="num_tickets" formControlName="num_tickets">
                    @for (n of ticketOptions; track n) {
                      <option [ngValue]="n">{{ n }} ticket{{ n === 1 ? '' : 's' }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="order-summary">
                <div class="order-row"><span>Ticket price</span><span>{{ event.ticket_price | price }}</span></div>
                <div class="order-row"><span>Tickets</span><span>{{ quantity }}</span></div>
                <div class="order-row total"><span>Total amount</span><span>{{ totalAmount | price }}</span></div>
              </div>

              <div class="form-actions form-actions-inline">
                <button type="submit" class="btn btn-amber" [disabled]="submitting"
                        (click)="submit()">
                  {{ submitting ? 'Submitting…' : 'Complete registration' }}
                </button>
                <a class="btn btn-outline" [routerLink]="['/event', event.event_id]">Cancel</a>
              </div>
            </form>
          </div>

          <aside class="detail-side register-info">
            <h2>Event information</h2>
            <ul class="fact-list">
              <li><span class="fact-label">Hosted by</span><span>{{ event.org_name }}</span></li>
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
              <li><span class="fact-label">Ticket</span><span>{{ event.ticket_price | price }}</span></li>
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
            <p class="register-note">{{ event.summary }}</p>
          </aside>
        </div>
      </section>
    } @else if (error) {
      <section class="section">
        <div class="container"><div class="empty-message show">{{ error }}</div></div>
      </section>
    }
  `,
})
export class RegisterComponent implements OnInit {
  event: EventDetail | null = null;
  weather: WeatherInfo | null = null;
  confirmation: Registration | null = null;
  form!: FormGroup;
  error = '';
  submitting = false;
  today = todayISO();
  ticketOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  private readonly emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private eventService: EventService,
    private weatherService: WeatherService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.pattern(this.emailRe)]],
      phone: [''],
      registration_date: [this.today, Validators.required],
      num_tickets: [1, Validators.required],
    });
    // Zoneless: reactive-form model updates do not schedule change detection by
    // themselves; mark the view for check so the live order summary refreshes.
    this.form.valueChanges.subscribe(() => this.cdr.markForCheck());

    const id = this.route.snapshot.paramMap.get('id');
    if (!id || !/^\d+$/.test(id)) {
      this.error = 'No valid event was selected. Please choose an event first.';
      return;
    }

    this.eventService.getEvent(id).subscribe({
      next: (res) => {
        this.event = res.data;
        this.cdr.markForCheck();
        this.weatherService
          .getForecast(this.event.latitude, this.event.longitude, this.event.event_date)
          .subscribe((w) => {
            this.weather = w;
            this.cdr.markForCheck();
          });
      },
      error: (err) => {
        this.error = err?.message || 'Event not found.';
        this.cdr.markForCheck();
      },
    });
  }

  get quantity(): number {
    return Number(this.form?.value.num_tickets ?? 1);
  }

  get totalAmount(): number {
    return this.event ? Number(this.event.ticket_price) * this.quantity : 0;
  }

  /** Runs the cross-field validation that depends on the loaded event. */
  private validate(): string {
    const v = this.form.value;
    if ((v.full_name || '').trim().length < 2) return 'Please enter your full name.';
    if (!this.emailRe.test((v.email || '').trim())) {
      return 'Please enter a valid contact email address.';
    }
    if (!v.registration_date) return 'Please choose the registration date.';
    if (v.registration_date < this.today) return 'Registration date cannot be in the past.';
    if (this.event && v.registration_date > this.event.event_date) {
      return 'Registration date cannot be after the event date.';
    }
    const qty = Number(v.num_tickets);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
      return 'Please choose between 1 and 10 tickets.';
    }
    return '';
  }

  submit(): void {
    if (!this.event || this.submitting) return;
    this.error = '';

    const problem = this.validate();
    if (problem) {
      this.error = problem;
      window.alert(problem);
      return;
    }

    this.submitting = true;
    const v = this.form.value;
    this.eventService
      .register(this.event.event_id, {
        full_name: (v.full_name || '').trim(),
        email: (v.email || '').trim(),
        phone: (v.phone || '').trim(),
        registration_date: v.registration_date,
        num_tickets: Number(v.num_tickets),
      })
      .subscribe({
        next: (res) => {
          this.confirmation = res.data;
          this.submitting = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          // Covers 409 "already registered" and any API validation error.
          this.error = err?.message || 'Registration failed.';
          window.alert(this.error);
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  get colour(): string {
    return this.event ? categoryColour(this.event.category_name) : '#5a7184';
  }

  weatherIcon = weatherIcon;
}
