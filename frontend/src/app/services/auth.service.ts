import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  email: string;
  role: string;
  company_name?: string;
  loginMethod?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario logueado al iniciar la aplicación
    this.checkAuthStatus();
  }

  checkAuthStatus(): void {
    this.http.get<User>('/api/auth/me').subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: () => {
        this.currentUserSubject.next(null);
      }
    });
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe(() => {
      this.currentUserSubject.next(null);
      window.location.href = '/catalogo';
    });
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Método para manejar el callback de Google OAuth
  handleGoogleCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      return;
    }

    // Verificar sesión con el backend
    this.checkAuthStatus();

    // Limpiar la URL de parámetros
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}