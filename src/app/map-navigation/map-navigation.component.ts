import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { StructureService } from '../services/structure.service';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { Structure, TypeStructure, StructureFilter } from '../models';

@Component({
  selector: 'app-map-navigation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-navigation.component.html',
  styleUrls: ['./map-navigation.component.scss']
})
export class MapNavigationComponent implements OnInit {
  private map: any;
  private L: any;
  private markersLayer: any;
  
  // Senegal coordinates (center of Senegal) - properly typed as LatLngTuple
  private readonly SENEGAL_CENTER: [number, number] = [14.4974, -14.4524];
  private readonly SENEGAL_BOUNDS: [[number, number], [number, number]] = [
    [12.3071, -17.5432], // Southwest
    [16.6919, -11.4677]  // Northeast
  ];

  // Data and UI state
  structures: Structure[] = [];
  filteredStructures: Structure[] = [];
  isLoading: boolean = false;
  searchTerm: string = '';
  selectedType: TypeStructure | '' = '';
  selectedRegion: string = '';
  selectedCity: string = '';
  
  // Available filter options
  structureTypes: { value: TypeStructure; label: string }[] = [];
  availableRegions: string[] = [];
  availableCities: string[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    private structureService: StructureService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.structureTypes = this.structureService.getStructureTypes();
  }

  ngOnInit() {
    this.loadStructures();
    this.loadFilterOptions();
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMap();
    }
  }

  private loadStructures() {
    this.isLoading = true;
    this.structureService.getAllStructures().subscribe({
      next: (structures) => {
        this.structures = structures;
        this.filteredStructures = structures;
        this.isLoading = false;
        
        // Update map markers if map is initialized
        if (this.map && this.L) {
          this.updateMapMarkers();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading structures:', error);
        this.notificationService.showError('Erreur lors du chargement des structures');
      }
    });
  }

  private loadFilterOptions() {
    // Load available regions
    this.structureService.getUniqueRegions().subscribe({
      next: (regions) => {
        this.availableRegions = regions;
      },
      error: (error) => {
        console.error('Error loading regions:', error);
      }
    });
  }

  private async initializeMap() {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // Dynamically import Leaflet only on client side
      const L = await import('leaflet');
      this.L = L.default || L;
      
      // Initialize the map centered on Senegal
      this.map = this.L.map('map').setView(this.SENEGAL_CENTER, 7);

      // Create markers layer group
      this.markersLayer = this.L.layerGroup().addTo(this.map);

      // Add OpenStreetMap tiles
      this.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);

      // Set map bounds to Senegal
      this.map.setMaxBounds(this.SENEGAL_BOUNDS);
      this.map.setMinZoom(6);
      this.map.setMaxZoom(18);

      // Add markers for loaded structures
      if (this.filteredStructures.length > 0) {
        this.updateMapMarkers();
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      this.notificationService.showError('Erreur lors de l\'initialisation de la carte');
    }
  }

  private updateMapMarkers() {
    if (!this.map || !this.L || !this.markersLayer) return;

    // Clear existing markers
    this.markersLayer.clearLayers();

    // Add markers for filtered structures
    this.filteredStructures.forEach(structure => {
      // For now, use default coordinates if structure doesn't have coordinates
      // In a real app, structures would have latitude/longitude fields
      const coords = this.getStructureCoordinates(structure);
      
      const marker = this.L.marker(coords)
        .bindPopup(`
          <div class="p-3">
            <h3 class="font-bold text-lg mb-2">${structure.name}</h3>
            <p class="text-sm text-gray-600 mb-1">${this.structureService.getStructureTypeDisplayName(structure.type)}</p>
            <p class="text-sm mb-1">${structure.address.street}, ${structure.address.city}</p>
            <p class="text-sm mb-1">${structure.address.region}, ${structure.address.country}</p>
            <p class="text-sm mb-1">📞 ${structure.contact.phone}</p>
            <p class="text-sm mb-2">✉️ ${structure.contact.email}</p>
            ${structure.description ? `<p class="text-sm mb-2">${structure.description}</p>` : ''}
            <button onclick="window.selectStructure(${structure.id})" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">
              Voir détails
            </button>
          </div>
        `);

      this.markersLayer.addLayer(marker);
    });

    // Make selectStructure function globally available for popup buttons
    (window as any).selectStructure = (id: number) => {
      this.selectStructure(id);
    };
  }

  private getStructureCoordinates(structure: Structure): [number, number] {
    // Since the backend doesn't provide coordinates, we'll generate some based on region/city
    // In a real application, structures would have latitude/longitude fields
    const regionCoords: { [key: string]: [number, number] } = {
      'Dakar': [14.7167, -17.4677],
      'Thiès': [14.7886, -16.9246],
      'Saint-Louis': [16.0180, -16.4889],
      'Kaolack': [14.1593, -16.0728],
      'Ziguinchor': [12.5681, -16.2719],
      'Diourbel': [14.6540, -16.2285],
      'Tambacounda': [13.7671, -13.6681],
      'Kolda': [12.8939, -14.9407],
      'Fatick': [14.3347, -16.4123],
      'Kaffrine': [14.1059, -15.5502],
      'Kédougou': [12.5572, -12.1761],
      'Louga': [15.6181, -16.2463],
      'Matam': [15.6554, -13.2553],
      'Sédhiou': [12.7081, -15.5569]
    };

    const baseCoords = regionCoords[structure.address.region] || this.SENEGAL_CENTER;
    
    // Add small random offset to avoid overlapping markers
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const offsetLng = (Math.random() - 0.5) * 0.02;
    
    return [baseCoords[0] + offsetLat, baseCoords[1] + offsetLng];
  }

  selectStructure(structureId: number) {
    // Navigate to structure details page
    this.router.navigate(['/building', structureId]);
  }

  // Search and filter methods
  onSearch() {
    if (this.searchTerm.trim()) {
      this.structureService.searchStructuresByName(this.searchTerm.trim()).subscribe({
        next: (structures) => {
          this.filteredStructures = structures;
          this.updateMapMarkers();
        },
        error: (error) => {
          console.error('Search error:', error);
          this.notificationService.showError('Erreur lors de la recherche');
        }
      });
    } else {
      this.applyFilters();
    }
  }

  onFilterChange() {
    this.applyFilters();
  }

  onRegionChange() {
    this.selectedCity = ''; // Reset city when region changes
    this.loadCitiesForRegion();
    this.applyFilters();
  }

  private loadCitiesForRegion() {
    if (this.selectedRegion) {
      this.structureService.getUniqueCitiesForRegion(this.selectedRegion).subscribe({
        next: (cities) => {
          this.availableCities = cities;
        },
        error: (error) => {
          console.error('Error loading cities:', error);
        }
      });
    } else {
      this.availableCities = [];
    }
  }

  private applyFilters() {
    const filter: StructureFilter = {};
    
    if (this.selectedType) {
      filter.type = this.selectedType;
    }
    if (this.selectedRegion) {
      filter.region = this.selectedRegion;
    }
    if (this.selectedCity) {
      filter.city = this.selectedCity;
    }

    if (Object.keys(filter).length > 0) {
      this.structureService.filterStructures(filter).subscribe({
        next: (structures) => {
          this.filteredStructures = structures;
          this.updateMapMarkers();
        },
        error: (error) => {
          console.error('Filter error:', error);
          this.notificationService.showError('Erreur lors du filtrage');
        }
      });
    } else {
      this.filteredStructures = this.structures;
      this.updateMapMarkers();
    }
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedRegion = '';
    this.selectedCity = '';
    this.availableCities = [];
    this.filteredStructures = this.structures;
    this.updateMapMarkers();
  }

  // Utility methods
  getStructureTypeDisplayName(type: TypeStructure): string {
    const typeMap: Record<string, string> = {
      'HOSPITAL': 'Hôpital',
      'CLINIC': 'Clinique',
      'PHARMACY': 'Pharmacie',
      'LABORATORY': 'Laboratoire'
    };
    return typeMap[type] || type;
  }

  // Map control methods
  zoomIn() {
    if (this.map && isPlatformBrowser(this.platformId)) {
      this.map.zoomIn();
    }
  }

  zoomOut() {
    if (this.map && isPlatformBrowser(this.platformId)) {
      this.map.zoomOut();
    }
  }

  locateUser() {
    if (!isPlatformBrowser(this.platformId)) return;
    
    if (navigator.geolocation && this.map) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          this.map.setView([latitude, longitude], 15);
          
          // Add user location marker
          this.L.marker([latitude, longitude] as [number, number])
            .addTo(this.map)
            .bindPopup('Votre position')
            .openPopup();
        },
        (error) => {
          console.error('Error getting location:', error);
          this.notificationService.showError('Impossible de localiser votre position');
        }
      );
    } else {
      this.notificationService.showWarning('La géolocalisation n\'est pas supportée par votre navigateur');
    }
  }

  // Navigation methods
  navigateToAddStructure() {
    this.router.navigate(['/add-building']);
  }

  // Utility methods
  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser() {
    return this.authService.getCurrentUser();
  }

  get canAddStructure(): boolean {
    return this.authService.isAuthenticated();
  }

  logout() {
    this.authService.logout();
  }
}
