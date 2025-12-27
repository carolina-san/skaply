import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-res-scanner',
  imports: [RouterLink],
  templateUrl: './res-scanner.html',
  styleUrl: './res-scanner.css'
})
export class ResScanner implements OnInit {
  constructor(private seo: SeoService) { }

  ngOnInit() {
    this.seo.setSeo({
      title: `Escáner QR de Muebles - Skäply`,
      description: `Escanea códigos QR en muebles para acceder a información detallada, visualización 3D y soporte en Skäply.`,
      canonical: `https://skaply.ovh/scanner`,
      index: true,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'name': 'Escáner QR de Muebles',
        'description': 'Escanea códigos QR para acceder a información y visualización 3D',
        'url': 'https://skaply.ovh/scanner'
      }
    });
  }
}
