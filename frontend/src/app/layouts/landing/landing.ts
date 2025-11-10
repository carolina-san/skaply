import { Component } from '@angular/core';
import { Menu } from '../../components/menu/menu';
import { Router } from '@angular/router';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-landing',
  imports: [Menu, Footer],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing {
  constructor(private router: Router) { }
  acceder() {
     this.router.navigate(['/catalogo']);
  }
}
