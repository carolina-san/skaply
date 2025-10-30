import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '../menu/menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Menu],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header {
  menuAbierto = false;

  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.menuAbierto = false;
      }
    });
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }
}
