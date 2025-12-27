import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './cookies.html',
  styleUrl: './legal.css'
})
export class Cookies implements OnInit {
  showScrollButton = false;

  constructor(private seo: SeoService) {}

  ngOnInit() {
    this.updateScrollButtonVisibility();
    this.seo.setSeo({
      title: `Política de Cookies - Skäply`,
      description: `Aprende cómo Skäply utiliza cookies para mejorar tu experiencia.`,
      canonical: `https://skaply.ovh/cookies`,
      index: false,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Política de Cookies',
        'description': 'Política de cookies de Skäply',
        'url': 'https://skaply.ovh/cookies',
        'isPartOf': {
          '@type': 'Organization',
          'name': 'Skäply'
        }
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.updateScrollButtonVisibility();
  }

  protected updateScrollButtonVisibility() {
    this.showScrollButton = window.scrollY > 300;
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

