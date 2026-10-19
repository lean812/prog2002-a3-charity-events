/**
 * app.routes.ts
 * The client-side route table. Each URL path maps to a standalone page
 * component rendered inside the root <router-outlet>. The detail and
 * register routes take an :id parameter.
 */
import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { SearchComponent } from './pages/search.component';
import { EventDetailComponent } from './pages/event-detail.component';
import { RegisterComponent } from './pages/register.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Home | Heart of Liuzhou' },
  { path: 'search', component: SearchComponent, title: 'Search Events | Heart of Liuzhou' },
  { path: 'event/:id', component: EventDetailComponent, title: 'Event Details | Heart of Liuzhou' },
  { path: 'register/:id', component: RegisterComponent, title: 'Register | Heart of Liuzhou' },
  { path: '**', redirectTo: '' },
];
