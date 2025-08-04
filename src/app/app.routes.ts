import { Routes } from '@angular/router';
import { RegisterComponent } from './register/register.component';
import { LoginComponent } from './login/login.component';
import { MapNavigationComponent } from './map-navigation/map-navigation.component';
import { BuildingDetailsComponent } from './building-details/building-details.component';
import { AddBuildingComponent } from './add-building/add-building.component';

export const routes: Routes = [
  { path: '', redirectTo: '/map', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'map', component: MapNavigationComponent },
  { path: 'building/:id', component: BuildingDetailsComponent },
  { path: 'add-building', component: AddBuildingComponent }
];
