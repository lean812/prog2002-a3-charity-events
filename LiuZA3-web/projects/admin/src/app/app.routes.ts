/**
 * app.routes.ts
 * Admin route table: the management list is the default route, and the same
 * form component handles both "new" and "edit/:id".
 */
import { Routes } from '@angular/router';
import { EventsListComponent } from './pages/events-list.component';
import { EventFormComponent } from './pages/event-form.component';

export const routes: Routes = [
  { path: '', component: EventsListComponent, title: 'Manage Events | Charity Admin' },
  { path: 'new', component: EventFormComponent, title: 'Create Event | Charity Admin' },
  { path: 'edit/:id', component: EventFormComponent, title: 'Edit Event | Charity Admin' },
  { path: '**', redirectTo: '' },
];
