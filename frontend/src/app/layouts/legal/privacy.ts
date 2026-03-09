import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/UI/footer/footer';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './privacy.html',
  styleUrl: './legal.css'
})
export class Privacy implements OnInit {
  showScrollButton = false;

  constructor(private seo: SeoService) { }

  ngOnInit() {
    this.updateScrollButtonVisibility();
    this.seo.setSeo({
      title: `Política de Privacidad - Skäply`,
      description: `Lee nuestra política de privacidad para entender cómo protegemos tus datos en Skäply.`,
      canonical: `https://skaply.ovh/privacy`,
      index: false,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Política de Privacidad',
        'description': 'Política de privacidad de Skäply',
        'url': 'https://skaply.ovh/privacy',
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

