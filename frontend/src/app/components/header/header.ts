import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Menu } from '../menu/menu';
import { Location, CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Menu, CommonModule],
  templateUrl: './header.html',
  styleUrls: ['./header.css']
})
export class Header implements OnInit {
  menuAbierto = false;
  showBackButton = true;

  constructor(private router: Router, private location: Location) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.menuAbierto = false;
        this.updateBackButtonVisibility();
      }
    });
  }

  ngOnInit(): void {
    this.updateBackButtonVisibility();
  }

  private updateBackButtonVisibility(): void {
    const currentUrl = this.router.url;
    this.showBackButton = currentUrl !== '/' && currentUrl !== '/home';
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  goBack(): void {
    this.location.back();
  }
}