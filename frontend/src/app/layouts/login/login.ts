import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  email: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Verificar si venimos del callback de Google
    if (window.location.search.includes('token=') || window.location.search.includes('error=')) {
      this.authService.handleGoogleCallback();
    }

    // Si ya está logueado, redirigir
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/catalogo']);
    }
  }

  onLogin(): void {
    if (!this.email || !this.password) {
      this.error = 'Por favor, completa todos los campos';
      return;
    }

    this.loading = true;
    this.error = '';

    this.apiService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.setToken(response.data.token);
        this.router.navigate(['/catalogo']);
      },
      error: (error) => {
        this.error = 'Email o contraseña incorrectos';
        this.loading = false;
      }
    });
  }

  onGoogleLogin(): void {
    this.apiService.loginWithGoogle();
  }
}
