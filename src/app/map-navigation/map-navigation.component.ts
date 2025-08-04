import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-map-navigation',
  imports: [CommonModule],
  templateUrl: './map-navigation.component.html',
  styleUrls: ['./map-navigation.component.scss']
})
export class MapNavigationComponent implements OnInit, AfterViewInit {
  private map: any;
  private L: any;
  
  // Senegal coordinates (center of Senegal) - properly typed as LatLngTuple
  private readonly SENEGAL_CENTER: [number, number] = [14.4974, -14.4524];
  private readonly SENEGAL_BOUNDS: [[number, number], [number, number]] = [
    [12.3071, -17.5432], // Southwest
    [16.6919, -11.4677]  // Northeast
  ];

  // Sample buildings data
  buildings = [
    {
      id: 1,
      name: "Ministère de l'Éducation",
      coords: [14.7167, -17.4677] as [number, number],
      type: "Bureau gouvernemental",
      address: "Dakar, Sénégal",
      phone: "+221 33 823 4567",
      hours: "Lun-Ven, 9h - 17h"
    },
    {
      id: 2,
      name: "Palais Présidentiel",
      coords: [14.7247, -17.4677] as [number, number],
      type: "Palais gouvernemental",
      address: "Dakar, Sénégal",
      phone: "+221 33 823 4568",
      hours: "Lun-Ven, 8h - 18h"
    },
    {
      id: 3,
      name: "Assemblée Nationale",
      coords: [14.7187, -17.4677] as [number, number],
      type: "Parlement",
      address: "Dakar, Sénégal",
      phone: "+221 33 823 4569",
      hours: "Lun-Ven, 9h - 17h"
    }
  ];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize any component logic here
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeMap();
    }
  }

  private async initializeMap() {
    if (!isPlatformBrowser(this.platformId)) return;

    // Dynamically import Leaflet only on client side
    const L = await import('leaflet');
    this.L = L;
    
    // Initialize the map centered on Senegal
    this.map = L.map('map').setView(this.SENEGAL_CENTER, 7);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Set map bounds to Senegal
    this.map.setMaxBounds(this.SENEGAL_BOUNDS);
    this.map.setMinZoom(6);
    this.map.setMaxZoom(18);

    // Add some sample markers for administrative buildings
    this.addSampleMarkers();
  }

  private addSampleMarkers() {
    if (!this.map || !this.L) return;

    this.buildings.forEach(building => {
      const marker = this.L.marker(building.coords)
        .addTo(this.map)
        .bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${building.name}</h3>
            <p class="text-sm text-gray-600">${building.type}</p>
            <p class="text-sm">${building.address}</p>
            <p class="text-sm">${building.phone}</p>
            <p class="text-sm">${building.hours}</p>
          </div>
        `);

      marker.on('click', () => {
        this.selectBuilding(building);
      });
    });
  }

  selectBuilding(building: any) {
    // Navigate to building details page
    this.router.navigate(['/building', building.id]);
  }

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
          alert('Impossible de localiser votre position');
        }
      );
    } else {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
    }
  }
}
