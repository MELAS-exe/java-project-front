import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { StructureService } from '../services/structure.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { 
  CreateStructureRequest, 
  UpdateStructureRequest, 
  Structure, 
  TypeStructure, 
  Contact, 
  Address, 
  OpeningHours 
} from '../models';

@Component({
  selector: 'app-add-building',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './add-building.component.html',
  styleUrls: ['./add-building.component.scss']
})
export class AddBuildingComponent implements OnInit {
  // Form data
  structureData = {
    name: '',
    type: '' as TypeStructure | '',
    description: '',
    contact: {
      phone: '',
      email: '',
      website: ''
    } as Contact,
    address: {
      street: '',
      city: '',
      region: '',
      postalCode: '',
      country: 'Sénégal'
    } as Address,
    openingHours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    } as OpeningHours
  };

  // UI state
  isLoading: boolean = false;
  errorMessage: string = '';
  isEditMode: boolean = false;
  editingStructureId: number | null = null;
  
  // Options
  structureTypes: { value: TypeStructure; label: string }[] = [];
  senegalRegions: string[] = [
    'Dakar', 'Thiès', 'Saint-Louis', 'Kaolack', 'Ziguinchor', 
    'Diourbel', 'Tambacounda', 'Kolda', 'Fatick', 'Kaffrine',
    'Kédougou', 'Louga', 'Matam', 'Sédhiou'
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private structureService: StructureService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.structureTypes = this.structureService.getStructureTypes();
    
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
  }

  ngOnInit() {
    // Check if we're in edit mode
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.isEditMode = true;
        this.editingStructureId = +params['edit'];
        this.loadStructureForEdit();
      }
    });
  }

  private loadStructureForEdit() {
    if (!this.editingStructureId) return;

    this.isLoading = true;
    
    // Try to get structure by ID (admin only) first, then fall back to public methods
    if (this.authService.isAdmin()) {
      this.structureService.getStructureById(this.editingStructureId).subscribe({
        next: (structure) => {
          this.populateFormWithStructure(structure);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading structure for edit:', error);
          this.loadStructureFromPublicEndpoint();
        }
      });
    } else {
      this.loadStructureFromPublicEndpoint();
    }
  }

  private loadStructureFromPublicEndpoint() {
    this.structureService.getAllStructures().subscribe({
      next: (structures) => {
        const structure = structures.find(s => s.id === this.editingStructureId);
        if (structure) {
          this.populateFormWithStructure(structure);
        } else {
          this.notificationService.showError('Structure non trouvée');
          this.router.navigate(['/map']);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.showError('Erreur lors du chargement de la structure');
        console.error('Error loading structures:', error);
      }
    });
  }

  private populateFormWithStructure(structure: Structure) {
    this.structureData = {
      name: structure.name,
      type: structure.type,
      description: structure.description || '',
      contact: { ...structure.contact },
      address: { ...structure.address },
      openingHours: structure.openingHours ? { ...structure.openingHours } : {
        monday: '',
        tuesday: '',
        wednesday: '',
        thursday: '',
        friday: '',
        saturday: '',
        sunday: ''
      }
    };
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditMode && this.editingStructureId) {
      this.updateStructure();
    } else {
      this.createStructure();
    }
  }

  private createStructure() {
    const createRequest: CreateStructureRequest = {
      name: this.structureData.name.trim(),
      type: this.structureData.type as TypeStructure,
      description: this.structureData.description.trim() || undefined,
      contact: {
        phone: this.structureData.contact.phone.trim(),
        email: this.structureData.contact.email.trim(),
        website: this.structureData.contact.website?.trim() || undefined
      },
      address: {
        street: this.structureData.address.street.trim(),
        city: this.structureData.address.city.trim(),
        region: this.structureData.address.region.trim(),
        postalCode: this.structureData.address.postalCode.trim(),
        country: this.structureData.address.country.trim()
      },
      openingHours: this.getCleanOpeningHours()
    };

    this.structureService.createStructure(createRequest).subscribe({
      next: (structure) => {
        this.isLoading = false;
        this.notificationService.showSuccess('Structure créée avec succès !');
        this.router.navigate(['/building', structure.id]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur lors de la création de la structure';
        this.notificationService.showError(this.errorMessage);
        console.error('Structure creation error:', error);
      }
    });
  }

  private updateStructure() {
    if (!this.editingStructureId) return;

    const updateRequest: UpdateStructureRequest = {
      id: this.editingStructureId,
      name: this.structureData.name.trim(),
      type: this.structureData.type as TypeStructure,
      description: this.structureData.description.trim() || undefined,
      contact: {
        phone: this.structureData.contact.phone.trim(),
        email: this.structureData.contact.email.trim(),
        website: this.structureData.contact.website?.trim() || undefined
      },
      address: {
        street: this.structureData.address.street.trim(),
        city: this.structureData.address.city.trim(),
        region: this.structureData.address.region.trim(),
        postalCode: this.structureData.address.postalCode.trim(),
        country: this.structureData.address.country.trim()
      },
      openingHours: this.getCleanOpeningHours()
    };

    this.structureService.updateStructure(this.editingStructureId, updateRequest).subscribe({
      next: (structure) => {
        this.isLoading = false;
        this.notificationService.showSuccess('Structure mise à jour avec succès !');
        this.router.navigate(['/building', structure.id]);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur lors de la mise à jour de la structure';
        this.notificationService.showError(this.errorMessage);
        console.error('Structure update error:', error);
      }
    });
  }

  private getCleanOpeningHours(): OpeningHours | undefined {
    const hours = this.structureData.openingHours;
    const cleanHours: Partial<OpeningHours> = {};
    
    Object.entries(hours).forEach(([day, time]) => {
      if (time && time.trim()) {
        (cleanHours as any)[day] = time.trim();
      }
    });

    return Object.keys(cleanHours).length > 0 ? cleanHours as OpeningHours : undefined;
  }

  private validateForm(): boolean {
    // Required fields validation
    if (!this.structureData.name.trim()) {
      this.errorMessage = 'Le nom de la structure est requis';
      return false;
    }

    if (!this.structureData.type) {
      this.errorMessage = 'Le type de structure est requis';
      return false;
    }

    if (!this.structureData.contact.phone.trim()) {
      this.errorMessage = 'Le numéro de téléphone est requis';
      return false;
    }

    if (!this.structureData.contact.email.trim()) {
      this.errorMessage = 'L\'adresse email est requise';
      return false;
    }

    if (!this.isValidEmail(this.structureData.contact.email)) {
      this.errorMessage = 'Adresse email invalide';
      return false;
    }

    if (!this.structureData.address.street.trim()) {
      this.errorMessage = 'L\'adresse est requise';
      return false;
    }

    if (!this.structureData.address.city.trim()) {
      this.errorMessage = 'La ville est requise';
      return false;
    }

    if (!this.structureData.address.region.trim()) {
      this.errorMessage = 'La région est requise';
      return false;
    }

    if (!this.structureData.address.postalCode.trim()) {
      this.errorMessage = 'Le code postal est requis';
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Template getters
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  cancel() {
    if (this.isEditMode && this.editingStructureId) {
      this.router.navigate(['/building', this.editingStructureId]);
    } else {
      this.router.navigate(['/map']);
    }
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Modifier la structure' : 'Ajouter une structure';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Mettre à jour' : 'Créer';
  }

  get canSubmit(): boolean {
    return !this.isLoading && this.authService.isAuthenticated();
  }
}
