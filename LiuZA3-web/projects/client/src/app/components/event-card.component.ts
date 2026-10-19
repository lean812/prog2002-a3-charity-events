/**
 * event-card.component.ts
 * A reusable presentational component that renders one event as a card.
 * The parent list component passes the event in through the @Input property;
 * Angular's interpolations {{ }} and property bindings keep the template in
 * sync automatically (no manual DOM manipulation).
 */
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CharityEvent } from '../models';
import { categoryColour, categoryInitials } from '../util';
import { EventDatePipe, PricePipe } from '../pipes';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [RouterLink, EventDatePipe, PricePipe],
  template: `
    <article class="event-card">
      <a class="card-thumb"
         [routerLink]="['/event', event.event_id]"
         [style.background]="'linear-gradient(135deg,' + colour + ',' + colour + 'bb)'"
         [attr.aria-label]="'View details of ' + event.event_name">
        <span class="thumb-initials">{{ initials }}</span>
        <span class="thumb-category">{{ event.category_name }}</span>
      </a>
      <div class="card-body">
        <h3 class="card-title">
          <a [routerLink]="['/event', event.event_id]">{{ event.event_name }}</a>
        </h3>
        <p class="card-meta">
          <span class="meta-icon" aria-hidden="true">&#128197;</span>
          {{ event.event_date | eventDate }}
        </p>
        <p class="card-meta">
          <span class="meta-icon" aria-hidden="true">&#128205;</span>
          {{ event.location_name || event.city }}
        </p>
        <div class="card-footer">
          <span class="ticket-price">{{ event.ticket_price | price }}</span>
          <a class="btn btn-sm" [routerLink]="['/event', event.event_id]">View details</a>
        </div>
      </div>
    </article>
  `,
})
export class EventCardComponent {
  @Input({ required: true }) event!: CharityEvent;

  get colour(): string {
    return categoryColour(this.event.category_name);
  }

  get initials(): string {
    return categoryInitials(this.event.category_name);
  }
}
