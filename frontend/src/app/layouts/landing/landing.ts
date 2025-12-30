import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AfterViewInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Router } from '@angular/router';
import { Footer } from '../../components/footer/footer';
import { DemoLanding } from '../../components/demo-landing/demo-landing';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-landing',
  imports: [Footer, CommonModule, DemoLanding],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements AfterViewInit {

  constructor(private router: Router, private seo: SeoService) { }

  acceder() {
    this.router.navigate(['/catalogo']);
  }

  goToMotor() {
    this.router.navigate(['/motor']);
  }
  @ViewChildren('card') cards!: QueryList<ElementRef>;
  @ViewChildren('fadeSlide') fadeSlides!: QueryList<ElementRef>;
  ngAfterViewInit() {
    this.seo.setSeo({
      title: `Skäply - Montaje de Muebles fácil`,
      description: `Descubre Skäply, la plataforma para montar tus muebles fácilmente. Catálogo completo, motor 3D interactivo y soporte profesional.`,
      canonical: `https://skaply.ovh/`,
      index: true,
      schema: {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "@id": "https://skaply.ovh/#webapplication",
        "name": "Skäply",
        "url": "https://skaply.ovh",
        "description": "Plataforma de montaje de muebles con motor 3D interactivo.",
        "applicationCategory": "MultimediaApplication",
        "operatingSystem": "All",
        "creator": {
          "@type": "Organization",
          "name": "LYNK",
          "url": "https://skaply.ovh/lynk/",
          "logo": "https://skaply.ovh/assets/imgs/lynk-logo.svg"
        }
      }

    });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = Number(entry.target.getAttribute('data-index') || 0);
          setTimeout(() => {
            entry.target.classList.add('show');
          }, index * 300);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    this.cards.forEach(card => observer.observe(card.nativeElement));
    this.fadeSlides.forEach(slide => observer.observe(slide.nativeElement));
  }

}
