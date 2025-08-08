import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Admin, CreateAdminRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly baseUrl = `${environment.apiUrl}/admins`;

  constructor(private http: HttpClient) {}

  // Public endpoint
  createAdmin(admin: CreateAdminRequest): Observable<Admin> {
    return this.http.post<Admin>(this.baseUrl, admin).pipe(
      catchError(this.handleError)
    );
  }

  // Utility methods
  validateAdminData(admin: CreateAdminRequest): string[] {
    const errors: string[] = [];

    if (!admin.email || !this.isValidEmail(admin.email)) {
      errors.push('Adresse email invalide');
    }

    if (!admin.password || admin.password.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 400:
          errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
          break;
        case 409:
          errorMessage = 'Un administrateur avec cette adresse email existe déjà.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Admin Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
}
