import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-marco-legal',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './marco-legal.html',
  styleUrl: './marco-legal.css'
})
export class MarcoLegal implements OnInit {
  showScrollButton = false;

  ngOnInit() {
    this.updateScrollButtonVisibility();
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateScrollButtonVisibility();
  }

  private updateScrollButtonVisibility() {
    this.showScrollButton = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
