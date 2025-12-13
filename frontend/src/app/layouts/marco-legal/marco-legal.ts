import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-marco-legal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './marco-legal.html',
  styleUrl: './marco-legal.css'
})
export class MarcoLegal {
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
