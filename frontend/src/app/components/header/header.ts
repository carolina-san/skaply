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
export class Header {
  
  showBackButton = true;
  currentRoute: string = '';

  constructor(private router: Router, private location: Location) {

     this.router.events.subscribe(() => {
      this.currentRoute = this.router.url;
    });
  }

  goBack(): void {
    this.location.back();
  }
  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
}