import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

export interface User {
  email: string;
  role: string;
  company_name: string;
  loginMethod?: string;
  id: number;
  name?: string;
  telephone?: string;
  tax_address?: string;
  cif?: string;
  image_url?: string;
  enabled?: boolean;
  visible?: boolean;
  registration_status?: 'pending' | 'approved' | 'rejected';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private isAuthReadySubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isAuthReady$: Observable<boolean> = this.isAuthReadySubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario logueado al iniciar la aplicación
    this.checkAuthStatus().subscribe();
  }

  checkAuthStatus(): Observable<User | null> {
    this.isAuthReadySubject.next(false);
    return this.http.get<User>('/api/auth/me').pipe(
      map((user) => {
        console.log(user);
        this.currentUserSubject.next(user);
        this.isAuthReadySubject.next(true);
        return user;
      }),
      catchError(() => {
        this.currentUserSubject.next(null);
        this.isAuthReadySubject.next(true);
        return of(null);
      })
    );
  }

  logout(): void {
    this.http.post('/api/auth/logout', {}).subscribe(() => {
      this.currentUserSubject.next(null);
      window.location.href = '/login';
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
    this.checkAuthStatus().subscribe();

    // Limpiar la URL de parámetros
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Método para actualizar el perfil del usuario
  updateMyProfile(updates: { name?: string; company_name?: string; email?: string; telephone?: string; password?: string; image_url?: string }): Observable<any> {
    return this.http.put('/api/auth/me', updates);
  }
}