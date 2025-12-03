import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

  constructor() {
    // Verificar si hay un usuario logueado al iniciar la aplicación
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    if (token) {
      const userData = this.decodeToken(token);
      if (userData && this.isTokenValid(token)) {
        this.currentUserSubject.next(userData);
      } else {
        this.logout();
      }
    }
  }

  setToken(token: string): void {
    localStorage.setItem('auth_token', token);
    const userData = this.decodeToken(token);
    if (userData) {
      this.currentUserSubject.next(userData);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token !== null && this.isTokenValid(token);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private decodeToken(token: string): User | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        email: payload.emailuser,
        role: payload.role,
        company_name: payload.company_name,
        loginMethod: payload.loginMethod || 'traditional'
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Método para manejar el callback de Google OAuth
  handleGoogleCallback(): void {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      console.error('Google OAuth error:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
      return;
    }

    if (token) {
      this.setToken(token);
      // Limpiar la URL de parámetros
      window.history.replaceState({}, document.title, window.location.pathname);
      // Redirigir al dashboard o página principal
      window.location.href = '/catalogo';
    }
  }
}