import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Log request if logging is enabled
  if (environment.enableLogging) {
    console.log(`[HTTP] ${req.method} ${req.url}`, req.body);
  }

  let authReq = req;

  // Add Basic Auth header if user is authenticated and request is to our API
  if (req.url.startsWith(environment.apiUrl)) {
    const credentials = authService.getStoredCredentials();
    if (credentials) {
      const basicAuth = btoa(`${credentials.email}:${credentials.password}`);
      authReq = req.clone({
        setHeaders: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json'
        }
      });
    } else {
      // Still set content type for non-authenticated requests
      authReq = req.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Log error if logging is enabled
      if (environment.enableLogging) {
        console.error(`[HTTP ERROR] ${error.status} ${error.statusText}`, error);
      }

      // Handle different error status codes
      switch (error.status) {
        case 401:
          // Unauthorized - clear credentials and redirect to login
          authService.logout();
          router.navigate(['/login']);
          break;
        case 403:
          // Forbidden - user doesn't have permission
          console.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
          break;
        case 404:
          console.error('Ressource non trouvée.');
          break;
        case 500:
          console.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;
        default:
          console.error('Une erreur inattendue s\'est produite.');
      }

      return throwError(() => error);
    })
  );
};
