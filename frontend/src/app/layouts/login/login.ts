import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

@Component({
  standalone: true,
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
    private router: Router,
    private seo: SeoService
  ) { }

  ngOnInit(): void {
    // Verificar si venimos del callback de Google
    if (window.location.search.includes('token=') || window.location.search.includes('error=')) {
      this.authService.handleGoogleCallback();
    }

    // Si ya está logueado, redirigir
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/catalogo']);
    }

    this.seo.setSeo({
      title: `Inicia sesión - Skäply`,
      description: `Accede a tu cuenta de Skäply para gestionar tu catálogo de muebles y montajes.`,
      canonical: `https://skaply.ovh/login`,
      index: false
    });
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
        this.loading = false;

        // Actualizar estado de autenticación (el token ya está en cookie)
        this.authService.checkAuthStatus();

        // Redirigir al catálogo
        this.router.navigate(['/catalogo']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Login error:', error);

        // Mensaje genérico por seguridad
        if (error.status === 404 || error.status === 401) {
          this.error = 'Datos incorrectos. Verifica tu email y contraseña';
        } else {
          this.error = 'Error al iniciar sesión. Inténtalo de nuevo';
        }
      }
    });
  }

  onGoogleLogin(): void {
    this.apiService.loginWithGoogle();
  }
}
