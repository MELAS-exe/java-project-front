import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AdminService } from '../services/admin.service';
import { MemberService } from '../services/member.service';
import { StructureService } from '../services/structure.service';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';
import { 
  CreateAdminRequest, 
  CreateMemberRequest, 
  Structure, 
  TypeStructure 
} from '../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  // Form fields
  firstName: string = '';
  lastName: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  userType: 'admin' | 'member' = 'member';
  selectedStructureId: number | null = null;
  roleInStructure: string = '';

  // UI state
  isLoading: boolean = false;
  errorMessage: string = '';
  structures: Structure[] = [];

  constructor(
    private adminService: AdminService,
    private memberService: MemberService,
    private structureService: StructureService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/map']);
    }
  }

  ngOnInit() {
    this.loadStructures();
  }

  private loadStructures() {
    this.structureService.getAllStructures().subscribe({
      next: (structures) => {
        this.structures = structures;
      },
      error: (error) => {
        console.error('Error loading structures:', error);
        this.notificationService.showError('Erreur lors du chargement des structures');
      }
    });
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.userType === 'admin') {
      this.createAdmin();
    } else {
      this.createMember();
    }
  }

  private createAdmin() {
    const adminRequest: CreateAdminRequest = {
      email: this.email.trim(),
      password: this.password
    };

    this.adminService.createAdmin(adminRequest).subscribe({
      next: (admin) => {
        this.isLoading = false;
        this.notificationService.showSuccess('Compte administrateur créé avec succès !');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur lors de la création du compte administrateur';
        this.notificationService.showError(this.errorMessage);
        console.error('Admin creation error:', error);
      }
    });
  }

  private createMember() {
    if (!this.selectedStructureId) {
      this.errorMessage = 'Veuillez sélectionner une structure';
      return;
    }

    const memberRequest: CreateMemberRequest = {
      email: this.email.trim(),
      password: this.password,
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      structureId: this.selectedStructureId,
      roleInStructure: this.roleInStructure.trim()
    };

    this.memberService.createMember(memberRequest).subscribe({
      next: (member) => {
        this.isLoading = false;
        this.notificationService.showSuccess('Compte membre créé avec succès !');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur lors de la création du compte membre';
        this.notificationService.showError(this.errorMessage);
        console.error('Member creation error:', error);
      }
    });
  }

  private validateForm(): boolean {
    // Common validations
    if (!this.email.trim()) {
      this.errorMessage = 'L\'adresse email est requise';
      return false;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Adresse email invalide';
      return false;
    }

    if (!this.password) {
      this.errorMessage = 'Le mot de passe est requis';
      return false;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères';
      return false;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return false;
    }

    // Member-specific validations
    if (this.userType === 'member') {
      if (!this.firstName.trim()) {
        this.errorMessage = 'Le prénom est requis';
        return false;
      }

      if (!this.lastName.trim()) {
        this.errorMessage = 'Le nom est requis';
        return false;
      }

      if (!this.selectedStructureId) {
        this.errorMessage = 'Veuillez sélectionner une structure';
        return false;
      }

      if (!this.roleInStructure.trim()) {
        this.errorMessage = 'Le rôle dans la structure est requis';
        return false;
      }
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onUserTypeChange() {
    // Reset form when user type changes
    this.errorMessage = '';
    if (this.userType === 'admin') {
      this.firstName = '';
      this.lastName = '';
      this.selectedStructureId = null;
      this.roleInStructure = '';
    }
  }

  getStructureTypeDisplayName(type: TypeStructure): string {
    return this.structureService.getStructureTypeDisplayName(type);
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
