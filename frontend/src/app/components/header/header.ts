import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '../menu/menu';
import { Location, CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

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

  constructor(
    private router: Router,
    private location: Location,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }


  ngOnInit() {
    window.addEventListener("scroll", () => {
      this.scrolled = window.scrollY > 30;
    });
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
    this.router.navigate(['/']);
  }

  // Verificar si hay sesión iniciada
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  // Cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/catalogo']);
  }
}