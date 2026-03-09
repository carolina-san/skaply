import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/UI/footer/footer';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './legal-notice.html',
  styleUrl: './legal.css'
})
export class LegalNotice implements OnInit {
  showScrollButton = false;

  constructor(private seo: SeoService) { }

  ngOnInit() {
    this.updateScrollButtonVisibility();
    this.seo.setSeo({
      title: `Aviso legal - Skäply`,
      description: `Consulta el aviso legal de Skäply con información sobre derechos y responsabilidades.`,
      canonical: `https://skaply.ovh/legal-notice`,
      index: false,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Aviso Legal',
        'description': 'Aviso legal de Skäply',
        'url': 'https://skaply.ovh/legal-notice',
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

