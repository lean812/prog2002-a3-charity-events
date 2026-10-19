/**
 * app.ts
 * Root component for the admin application. Holds the admin header/footer and
 * the <router-outlet> for the management list and the create/edit form.
 */
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="site-header admin-header">
      <div class="container nav">
        <a class="brand" routerLink="/">
          <span class="brand-mark" aria-hidden="true">&#9881;</span>
          Charity Events <span class="admin-tag">Admin</span>
        </a>
        <nav>
          <ul class="nav-menu">
            <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Manage Events</a></li>
            <li><a routerLink="/new" routerLinkActive="active">Create Event</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="container footer-bottom">
        Charity Events Administration &middot; PROG2002 Assessment 3 &middot; Internal staff site
        &middot; (Angular v22)
      </div>
    </footer>
  `,
})
export class App {}
