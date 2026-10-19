/**
 * pipes.ts
 * Small standalone Angular pipes used in templates. Angular pipes are the
 * framework's way to transform a value for display (e.g. formatting a date or
 * a price) while keeping the component class free of presentation code.
 */
import { Pipe, PipeTransform } from '@angular/core';

/** Formats a YYYY-MM-DD date as an Australian friendly string, e.g. "Mon 5 Oct 2026". */
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

/** Formats a "HH:MM:SS" (or "HH:MM") time as a 12-hour value, e.g. "9:30 AM". */
@Pipe({ name: 'eventTime', standalone: true })
export class EventTimePipe implements PipeTransform {
  transform(timeStr: string | null | undefined): string {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const hour = Number(parts[0]);
    const minute = parts[1] ?? '00';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute} ${ampm}`;
  }
}

/** 0 is "Free", otherwise a dollar amount with two decimals. */
@Pipe({ name: 'price', standalone: true })
export class PricePipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const num = Number(value);
    if (num === 0) return 'Free';
    return '$' + num.toFixed(2);
  }
}

/** Adds thousands separators to a money amount, e.g. 12000 -> "12,000". */
@Pipe({ name: 'money', standalone: true })
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString();
  }
}
