/**
 * pipes.ts
 * Standalone display pipes for the admin tables.
 */
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'eventDate', standalone: true })
export class EventDatePipe implements PipeTransform {
  transform(dateStr: string | null | undefined): string {
    if (!dateStr) return 'TBC';
    const d = new Date(dateStr + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const num = Number(value);
    if (num === 0) return 'Free';
    return '$' + num.toFixed(2);
  }
}
