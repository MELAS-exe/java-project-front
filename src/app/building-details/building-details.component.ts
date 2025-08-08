import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { StructureService } from '../services/structure.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Structure, AvailableDoc, TypeStructure } from '../models';

@Component({
  selector: 'app-building-details',
  imports: [CommonModule],
  templateUrl: './building-details.component.html',
  styleUrl: './building-details.component.scss'
})
export class BuildingDetailsComponent implements OnInit {
  structure: Structure | null = null;
  availableDocs: AvailableDoc[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';
  structureId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private structureService: StructureService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.structureId = +params['id'];
      if (this.structureId) {
        this.loadStructureDetails();
        this.loadAvailableDocs();
      }
    });
  }

  private loadStructureDetails() {
    this.isLoading = true;
    this.errorMessage = '';

    // Try to get structure by ID (admin only) first, then fall back to public methods
    if (this.authService.isAdmin()) {
      this.structureService.getStructureById(this.structureId).subscribe({
        next: (structure) => {
          this.structure = structure;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading structure details:', error);
          this.loadStructureFromPublicEndpoint();
        }
      });
    } else {
      this.loadStructureFromPublicEndpoint();
    }
  }

  private loadStructureFromPublicEndpoint() {
    // Since we can't get individual structures from public endpoints,
    // we'll get all structures and find the one we need
    this.structureService.getAllStructures().subscribe({
      next: (structures) => {
        this.structure = structures.find(s => s.id === this.structureId) || null;
        this.isLoading = false;
        
        if (!this.structure) {
          this.errorMessage = 'Structure non trouvée';
          this.notificationService.showError('Structure non trouvée');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Erreur lors du chargement de la structure';
        this.notificationService.showError('Erreur lors du chargement de la structure');
        console.error('Error loading structures:', error);
      }
    });
  }

  private loadAvailableDocs() {
    this.structureService.getAvailableDocsByStructureId(this.structureId).subscribe({
      next: (docs) => {
        this.availableDocs = docs;
      },
      error: (error) => {
        console.error('Error loading available documents:', error);
        // Don't show error notification for docs as it's not critical
      }
    });
  }

  deleteStructure() {
    if (!this.structure || !this.authService.isAdmin()) {
      this.notificationService.showError('Vous n\'avez pas les permissions pour supprimer cette structure');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer la structure "${this.structure.name}" ?`)) {
      this.structureService.deleteStructure(this.structure.id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Structure supprimée avec succès');
          this.router.navigate(['/map']);
        },
        error: (error) => {
          this.notificationService.showError('Erreur lors de la suppression de la structure');
          console.error('Error deleting structure:', error);
        }
      });
    }
  }

  editStructure() {
    if (!this.structure) return;
    
    if (this.canEditStructure()) {
      this.router.navigate(['/add-building'], { 
        queryParams: { edit: this.structure.id } 
      });
    } else {
      this.notificationService.showError('Vous n\'avez pas les permissions pour modifier cette structure');
    }
  }

  canEditStructure(): boolean {
    if (!this.structure) return false;
    return this.authService.canModifyStructure(this.structure.id);
  }

  canDeleteStructure(): boolean {
    return this.authService.isAdmin();
  }

  getStructureTypeDisplayName(type: TypeStructure): string {
    return this.structureService.getStructureTypeDisplayName(type);
  }

  getOpeningHoursArray(): { day: string; hours: string }[] {
    if (!this.structure?.openingHours) return [];
    
    const days = [
      { key: 'monday', label: 'Lundi' },
      { key: 'tuesday', label: 'Mardi' },
      { key: 'wednesday', label: 'Mercredi' },
      { key: 'thursday', label: 'Jeudi' },
      { key: 'friday', label: 'Vendredi' },
      { key: 'saturday', label: 'Samedi' },
      { key: 'sunday', label: 'Dimanche' }
    ];

    return days
      .map(day => ({
        day: day.label,
        hours: (this.structure!.openingHours as any)[day.key] || 'Fermé'
      }))
      .filter(item => item.hours !== 'Fermé');
  }

  getDocumentTypeDisplayName(type: string): string {
    const typeNames: { [key: string]: string } = {
      'PASSPORT': 'Passeport',
      'ID_CARD': 'Carte d\'identité',
      'BIRTH_CERTIFICATE': 'Acte de naissance',
      'MEDICAL_CERTIFICATE': 'Certificat médical'
    };
    return typeNames[type] || type;
  }

  goBack() {
    this.router.navigate(['/map']);
  }

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }
}
