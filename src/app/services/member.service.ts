import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  MemberStructure, 
  CreateMemberRequest, 
  UpdateMemberRequest 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private readonly baseUrl = `${environment.apiUrl}/membres_structures`;

  constructor(private http: HttpClient) {}

  // Public endpoint
  createMember(member: CreateMemberRequest): Observable<MemberStructure> {
    return this.http.post<MemberStructure>(this.baseUrl, member).pipe(
      catchError(this.handleError)
    );
  }

  // Admin-only endpoints
  getAllMembers(): Observable<MemberStructure[]> {
    return this.http.get<MemberStructure[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getMemberById(id: number): Observable<MemberStructure> {
    return this.http.get<MemberStructure>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  deleteMember(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Admin & Structure Member endpoints
  updateMember(id: number, member: UpdateMemberRequest): Observable<MemberStructure> {
    return this.http.put<MemberStructure>(`${this.baseUrl}/${id}`, member).pipe(
      catchError(this.handleError)
    );
  }

  // Utility methods
  getMembersByStructureId(structureId: number): Observable<MemberStructure[]> {
    return new Observable(observer => {
      this.getAllMembers().subscribe({
        next: (members) => {
          const filteredMembers = members.filter(m => m.structure.id === structureId);
          observer.next(filteredMembers);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  getMemberFullName(member: MemberStructure): string {
    return `${member.firstName} ${member.lastName}`;
  }

  validateMemberData(member: CreateMemberRequest | UpdateMemberRequest): string[] {
    const errors: string[] = [];

    if (!member.email || !this.isValidEmail(member.email)) {
      errors.push('Adresse email invalide');
    }

    if (!member.firstName || member.firstName.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }

    if (!member.lastName || member.lastName.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if ('password' in member && member.password && member.password.length < 6) {
      errors.push('Le mot de passe doit contenir au moins 6 caractères');
    }

    if (!member.roleInStructure || member.roleInStructure.trim().length < 2) {
      errors.push('Le rôle dans la structure est requis');
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
        case 401:
          errorMessage = 'Vous devez être connecté pour effectuer cette action.';
          break;
        case 403:
          errorMessage = 'Vous n\'avez pas les permissions nécessaires pour cette action.';
          break;
        case 404:
          errorMessage = 'Membre non trouvé.';
          break;
        case 409:
          errorMessage = 'Un membre avec cette adresse email existe déjà.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Member Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
}
