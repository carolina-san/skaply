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
  scrolled = false;
  
  constructor(private router: Router, private location: Location) {

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

  finMontaje(){
    fetch("http://localhost:3000/api/chatbot/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: '123456' })
    });
  }
  scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
 
 
}