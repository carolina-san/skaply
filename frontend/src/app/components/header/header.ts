import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '../menu/menu';

@Component({
  selector: 'app-header',
  standalone: true, // 👈 añádelo si quieres usar imports directamente
  imports: [Menu],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  menuAbierto = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.menuAbierto = false; // 👈 cierra el menú al navegar
      }
    });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
}
