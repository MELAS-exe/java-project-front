import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { 
  Structure, 
  TypeStructure, 
  AvailableDoc, 
  CreateStructureRequest, 
  UpdateStructureRequest,
  StructureFilter 
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class StructureService {
  private readonly baseUrl = `${environment.apiUrl}/structures`;

  constructor(private http: HttpClient) {}

  // Public endpoints (no authentication required)
  getAllStructures(): Observable<Structure[]> {
    return this.http.get<Structure[]>(this.baseUrl).pipe(
      catchError(this.handleError)
    );
  }

  getStructuresByType(type: TypeStructure): Observable<Structure[]> {
    return this.http.get<Structure[]>(`${this.baseUrl}/type/${type}`).pipe(
      catchError(this.handleError)
    );
  }

  searchStructuresByName(name: string): Observable<Structure[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<Structure[]>(`${this.baseUrl}/search`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getStructuresByRegion(region: string): Observable<Structure[]> {
    return this.http.get<Structure[]>(`${this.baseUrl}/region/${region}`).pipe(
      catchError(this.handleError)
    );
  }

  getStructuresByRegionAndCity(region: string, city: string): Observable<Structure[]> {
    return this.http.get<Structure[]>(`${this.baseUrl}/region/${region}/city/${city}`).pipe(
      catchError(this.handleError)
    );
  }

  getAvailableDocsByStructureId(id: number): Observable<AvailableDoc[]> {
    return this.http.get<AvailableDoc[]>(`${this.baseUrl}/available_docs/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  filterStructures(filter: StructureFilter): Observable<Structure[]> {
    let params = new HttpParams();
    
    if (filter.type) {
      params = params.set('type', filter.type);
    }
    if (filter.region) {
      params = params.set('region', filter.region);
    }
    if (filter.city) {
      params = params.set('city', filter.city);
    }

    return this.http.get<Structure[]>(`${this.baseUrl}/filter`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  createStructure(structure: CreateStructureRequest): Observable<Structure> {
    return this.http.post<Structure>(this.baseUrl, structure).pipe(
      catchError(this.handleError)
    );
  }

  addDocumentToStructure(structureId: number, document: AvailableDoc): Observable<AvailableDoc> {
    return this.http.post<AvailableDoc>(`${this.baseUrl}/${structureId}/document`, document).pipe(
      catchError(this.handleError)
    );
  }

  // Admin-only endpoints
  getStructureById(id: number): Observable<Structure> {
    return this.http.get<Structure>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  deleteStructure(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  // Admin & Structure Member endpoints
  updateStructure(id: number, structure: UpdateStructureRequest): Observable<Structure> {
    return this.http.put<Structure>(`${this.baseUrl}/${id}`, structure).pipe(
      catchError(this.handleError)
    );
  }

  // Utility methods for frontend
  getStructureTypeDisplayName(type: TypeStructure): string {
    const typeNames: Record<TypeStructure, string> = {
      [TypeStructure.HOSPITAL]: 'Hôpital',
      [TypeStructure.CLINIC]: 'Clinique',
      [TypeStructure.PHARMACY]: 'Pharmacie',
      [TypeStructure.LABORATORY]: 'Laboratoire'
    };
    return typeNames[type] || type;
  }

  getStructureTypes(): { value: TypeStructure; label: string }[] {
    return [
      { value: TypeStructure.HOSPITAL, label: 'Hôpital' },
      { value: TypeStructure.CLINIC, label: 'Clinique' },
      { value: TypeStructure.PHARMACY, label: 'Pharmacie' },
      { value: TypeStructure.LABORATORY, label: 'Laboratoire' }
    ];
  }

  // Get unique regions from structures (for filtering)
  getUniqueRegions(): Observable<string[]> {
    return new Observable(observer => {
      this.getAllStructures().subscribe({
        next: (structures) => {
          const regions = [...new Set(structures.map(s => s.address.region))].sort();
          observer.next(regions);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
  }

  // Get unique cities for a region (for filtering)
  getUniqueCitiesForRegion(region: string): Observable<string[]> {
    return new Observable(observer => {
      this.getStructuresByRegion(region).subscribe({
        next: (structures) => {
          const cities = [...new Set(structures.map(s => s.address.city))].sort();
          observer.next(cities);
          observer.complete();
        },
        error: (error) => observer.error(error)
      });
    });
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
          errorMessage = 'Structure non trouvée.';
          break;
        case 409:
          errorMessage = 'Cette structure existe déjà.';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('Structure Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  };
}
