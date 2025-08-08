import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../environments/environment';
import { 
  LoginRequest, 
  AuthUser, 
  UserRole, 
  MemberStructure, 
  Admin 
} from '../models';

interface StoredCredentials {
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly CREDENTIALS_KEY = 'auth_credentials';
  private readonly USER_KEY = 'current_user';
  
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.initializeAuthState();
  }

  private initializeAuthState(): void {
    const storedUser = this.getStoredUser();
    const storedCredentials = this.getStoredCredentials();
    
    if (storedUser && storedCredentials) {
      this.currentUserSubject.next(storedUser);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<AuthUser> {
    // Store credentials temporarily for the login request
    const basicAuth = btoa(`${credentials.email}:${credentials.password}`);
    
    const headers = {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/json'
    };

    return this.http.post<any>(`${environment.apiUrl}/login`, {}, { headers }).pipe(
      map(() => {
        // If login is successful, we need to determine user type and get user info
        return this.determineUserType(credentials);
      }),
      catchError(this.handleError)
    );
  }

  private determineUserType(credentials: LoginRequest): AuthUser {
    // Since we can't modify backend, we'll try to get user info from members endpoint first
    // If that fails (403), user is likely an admin
    
    // For now, we'll create a basic user object and enhance it later
    // This is a simplified approach - in a real scenario, the backend should return user info on login
    const user: AuthUser = {
      id: 0, // Will be updated when we get actual user data
      email: credentials.email,
      role: UserRole.MEMBRE_STRUCTURE // Default assumption
    };

    // Store credentials and user info
    this.storeCredentials(credentials);
    this.storeUser(user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);

    return user;
  }

  logout(): void {
    // Clear stored data
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem(this.CREDENTIALS_KEY);
      sessionStorage.removeItem(this.USER_KEY);
    }
    
    // Update state
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Redirect to login
    this.router.navigate(['/login']);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole(UserRole.ADMIN);
  }

  isMemberStructure(): boolean {
    return this.hasRole(UserRole.MEMBRE_STRUCTURE);
  }

  canAccessAdminFeatures(): boolean {
    return this.isAdmin();
  }

  canModifyStructure(structureId?: number): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Admins can modify any structure
    if (this.isAdmin()) return true;
    
    // Members can only modify their own structure
    if (this.isMemberStructure() && user.structure?.id === structureId) {
      return true;
    }
    
    return false;
  }

  getStoredCredentials(): StoredCredentials | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const stored = sessionStorage.getItem(this.CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private storeCredentials(credentials: LoginRequest): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const toStore: StoredCredentials = {
      email: credentials.email,
      password: credentials.password
    };
    sessionStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(toStore));
  }

  private getStoredUser(): AuthUser | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }
    const stored = sessionStorage.getItem(this.USER_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  private storeUser(user: AuthUser): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Enhanced user info retrieval - call this after login to get complete user data
  loadUserProfile(): Observable<AuthUser> {
    const credentials = this.getStoredCredentials();
    if (!credentials) {
      return throwError(() => new Error('No credentials found'));
    }

    // Try to get member info first
    return this.http.get<MemberStructure[]>(`${environment.apiUrl}/membres_structures`).pipe(
      map(members => {
        const member = members.find(m => m.email === credentials.email);
        if (member) {
          const user: AuthUser = {
            id: member.id,
            email: member.email,
            role: UserRole.MEMBRE_STRUCTURE,
            firstName: member.firstName,
            lastName: member.lastName,
            structure: member.structure,
            roleInStructure: member.roleInStructure
          };
          this.storeUser(user);
          this.currentUserSubject.next(user);
          return user;
        }
        
        // If not found in members, assume admin
        const adminUser: AuthUser = {
          id: 1, // Placeholder ID
          email: credentials.email,
          role: UserRole.ADMIN
        };
        this.storeUser(adminUser);
        this.currentUserSubject.next(adminUser);
        return adminUser;
      }),
      catchError(error => {
        // If we can't access members (403), user is likely admin
        if (error.status === 403) {
          const adminUser: AuthUser = {
            id: 1, // Placeholder ID
            email: credentials.email,
            role: UserRole.ADMIN
          };
          this.storeUser(adminUser);
          this.currentUserSubject.next(adminUser);
          return [adminUser];
        }
        return throwError(() => error);
      })
    );
  }

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Une erreur inattendue s\'est produite';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 401:
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 403:
          errorMessage = 'Accès refusé';
          break;
        case 404:
          errorMessage = 'Service non disponible';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Auth Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
}
