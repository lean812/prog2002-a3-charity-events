/**
 * search.component.ts
 * The Search Events page. Uses Angular two-way binding ([(ngModel)]) for the
 * filter fields, builds the query, calls the API and renders the matches.
 * A past date is rejected before the request is sent.
 */
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventService } from '../services/event.service';
import { Category, CharityEvent } from '../models';
import { EventCardComponent } from '../components/event-card.component';
import { todayISO } from '../util';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, EventCardComponent],
  template: `
    <section class="section">
      <div class="container">
        <h1 class="section-title">Search events</h1>
        <p class="section-sub">Filter upcoming events by date, location or category.</p>

        <div class="layout-search">
          <aside class="filters-panel">
            <h2>Filters</h2>
            @if (error) {
              <div class="error-banner show" role="alert">{{ error }}</div>
            }
            <form (ngSubmit)="runSearch()">
              <div class="field">
                <label for="filter-date">Date</label>
                <input id="filter-date" type="date" [(ngModel)]="date" name="date" />
              </div>
              <div class="field">
                <label for="filter-location">Location / city</label>
                <input id="filter-location" type="text" [(ngModel)]="location" name="location"
                       placeholder="e.g. Liuzhou" />
              </div>
              <div class="field">
                <label for="filter-category">Category</label>
                <select id="filter-category" [(ngModel)]="categoryId" name="category_id">
                  <option value="">All categories</option>
                  @for (c of categories; track c.category_id) {
                    <option [value]="c.category_id">{{ c.category_name }}</option>
                  }
                </select>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn">Apply filters</button>
                <button type="button" class="btn btn-outline" (click)="clearFilters()">
                  Clear filters
                </button>
              </div>
            </form>
          </aside>

          <div>
            <p class="results-count">{{ resultsCount }}</p>
            @if (loading) {
              <div class="loading"><div class="spinner"></div> Searching&hellip;</div>
            } @else if (events.length === 0) {
              <p class="empty-message">No events match your filters.</p>
            } @else {
              <div class="events-grid">
                @for (ev of events; track ev.event_id) {
                  <app-event-card [event]="ev" />
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
})
export class SearchComponent implements OnInit {
  categories: Category[] = [];
  events: CharityEvent[] = [];
  date = '';
  location = '';
  categoryId = '';
  loading = true;
  error = '';
  resultsCount = '';

  constructor(
    private eventService: EventService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.eventService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Could not load categories: ' + err?.message;
        this.cdr.markForCheck();
      },
    });
    this.runSearch();
  }

  runSearch(): void {
    // A past date cannot return upcoming events.
    if (this.date && this.date < todayISO()) {
      this.error = 'Please choose today or a future date; past events are not open for registration.';
      return;
    }
    this.error = '';
    this.loading = true;

    this.eventService
      .getEvents({
        date: this.date,
        location: this.location.trim(),
        category_id: this.categoryId,
      })
      .subscribe({
        next: (res) => {
          this.events = res.data;
          const count = res.count ?? res.data.length;
          this.resultsCount = `${count} event${count === 1 ? '' : 's'} found`;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.message || 'Search failed.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  clearFilters(): void {
    this.date = '';
    this.location = '';
    this.categoryId = '';
    this.runSearch();
  }
}
