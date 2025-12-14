import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './cookies.html',
  styleUrl: './cookies.css'
})
export class Cookies implements OnInit {
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
