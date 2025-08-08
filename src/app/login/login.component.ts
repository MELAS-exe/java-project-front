import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { LoginRequest } from '../models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  rememberMe: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';

  private returnUrl: string = '/map';

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Get return url from route parameters or default to '/map'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/map';
    
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const loginRequest: LoginRequest = {
      email: this.email.trim(),
      password: this.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.notificationService.showSuccess(`Bienvenue ${user.email} !`);
        
        // Load complete user profile
        this.authService.loadUserProfile().subscribe({
          next: (completeUser) => {
            console.log('User profile loaded:', completeUser);
            this.router.navigate([this.returnUrl]);
          },
          error: (error) => {
            console.warn('Could not load complete user profile:', error);
            // Still navigate to return URL even if profile loading fails
            this.router.navigate([this.returnUrl]);
          }
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erreur de connexion';
        this.notificationService.showError(this.errorMessage);
        console.error('Login error:', error);
      }
    });
  }

  private validateForm(): boolean {
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

    return true;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  navigateToRegister() {
    this.router.navigate(['/register']);
  }
}
