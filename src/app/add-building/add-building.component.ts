import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-building',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-building.component.html',
  styleUrls: ['./add-building.component.scss']
})
export class AddBuildingComponent {
  building = {
    name: '',
    type: '',
    address: '',
    contact: '',
    description: '',
    photos: [] as File[]
  };

  onSubmit() {
    console.log('Building data:', this.building);
    // TODO: Send data to backend
    alert('Bâtiment ajouté avec succès !');
  }

  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.building.photos = Array.from(files);
      console.log('Selected files:', this.building.photos);
    }
  }
}
