/**
 * app.ts
 * The root component for the client-side application. It holds the shared
 * site header/footer and the <router-outlet>, where Angular renders the
 * component that matches the current URL (home, search, detail, register).
 */
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <header class="site-header">
      <div class="container nav">
        <a class="brand" routerLink="/">
          <span class="brand-mark" aria-hidden="true">&#9829;</span>
          Heart of Liuzhou
        </a>
        <nav>
          <ul class="nav-menu">
            <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a></li>
            <li><a routerLink="/search" routerLinkActive="active">Search Events</a></li>
          </ul>
        </nav>
      </div>
    </header>

    <main>
      <router-outlet />
    </main>

    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <h4>Heart of Liuzhou Foundation</h4>
          <p>Connecting caring people with local causes through community fundraising events.</p>
        </div>
        <div>
          <h4>Explore</h4>
          <p><a routerLink="/">Home</a><br /><a routerLink="/search">Search Events</a></p>
        </div>
        <div>
          <h4>Contact</h4>
          <p>hello@heartofliuzhou.org<br />+86 772 2600 100</p>
        </div>
      </div>
      <div class="container footer-bottom">
        &copy; 2026 Heart of Liuzhou Foundation. A case-study website for PROG2002 (Angular v22).
      </div>
    </footer>
  `,
})
export class App {}
