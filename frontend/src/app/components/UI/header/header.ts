import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '../menu/menu';
import { Location, CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Menu, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {

  showBackButton = true;
  currentRoute: string = '';
  scrolled = false;
  private navigationHistory: string[] = [];

  constructor(
    private router: Router,
    private location: Location,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentRoute = this.router.url;
        this.trackNavigation();
      }
    });
  }


  ngOnInit() {
    window.addEventListener("scroll", () => {
      this.scrolled = window.scrollY > 30;
    });
  }

  private trackNavigation(): void {
    // Evitar agregar duplicados consecutivos
    if (this.navigationHistory[this.navigationHistory.length - 2] !== this.currentRoute) {
      this.navigationHistory.push(this.currentRoute);
    }
  }

  canGoBack(): boolean {
    // Solo permitir ir atrás si hay más de un elemento en el historial
    // (el primero es la página actual)
    return this.navigationHistory.length > 1 && !this.isHome;
  }

  goBack(): void {

    this.finMontaje(); // Elimina el contexto del mueble (comprobar si sale de un montaje)
    this.location.back();
  }

  get isHome(): boolean {
    return this.router.url.split('?')[0] === '/';
  }

  get isViewer3D(): boolean {
    return this.currentRoute.includes('viewer-3d');
  }

  get isLogin(): boolean {
    return this.router.url.split('?')[0] === '/login';
  }

  finMontaje() {
    if (this.currentRoute.includes('viewer-3d')) {
      this.apiService.resetAssembly().subscribe({
        next: (res) => {
          console.log("Montaje finalizado:", res);
        },
        error: (err) => {
          console.error("Error finalizando montaje:", err);
        }
      });
    }
  }
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goHome(): void {
    this.finMontaje();
    this.router.navigate(['/home']);
  }
  goLogin(): void {
    this.router.navigate(['/login']);
  }

  // Verificar si hay sesión iniciada
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Cerrar sesión (se mantiene por si acaso, pero el botón ahora usa goToProfile)
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/home']);
  }

  goToProfile(): void {
    const user = this.authService.getCurrentUser();

    if (user?.role === 'provider') {
      this.router.navigate(['/provider']);
    } else if (user?.role === 'admin') {
      this.router.navigate(['/admin']);
    } else {
      // Fallback si no es ni admin ni provider
      this.logout();
    }
  }
}