/**
 * app.config.ts
 * Application-wide providers for the client app. The Angular router is
 * provided from app.routes and the HttpClient is provided once here so the
 * services can inject it.
 *
 * Angular v22 is zoneless by default. This application uses zoneless change
 * detection; components notify Angular via signals / ChangeDetectorRef.
 */
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withXhr()),
  ],
};
