//Este es un servicio para gestionar los metadatos dinamicos de SEO en la aplicacion, 
// para usarlo llamar a la funcion setSeo con los parametros necesarios


import { Injectable, Inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class SeoService {

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  setSeo(config: {
    title: string;
    description: string;
    canonical: string;
    index?: boolean;
    schema?: any;
  }) {
    
    // Titulo
    this.title.setTitle(config.title);

    // Descripcion
    this.meta.updateTag({
      name: 'description',
      content: config.description
    });

    // indexar o no indexar
    this.meta.updateTag({
      name: 'robots',
      content: config.index === false ? 'noindex, follow' : 'index, follow'
    });

    // canonical
    this.setCanonical(config.canonical);

    // Schema.org estructurado
    if (config.schema) {
      this.setSchema(config.schema);
    }
  }

  private setCanonical(url: string) {
    let link: HTMLLinkElement =
      this.document.querySelector("link[rel='canonical']") ||
      this.document.createElement('link');

    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', url);

    if (!link.parentNode) {
      this.document.head.appendChild(link);
    }
  }

  private setSchema(schema: any) {
    let script: HTMLScriptElement =
      this.document.querySelector("script[type='application/ld+json']") ||
      this.document.createElement('script');

    script.setAttribute('type', 'application/ld+json');
    script.textContent = JSON.stringify(schema);

    if (!script.parentNode) {
      this.document.head.appendChild(script);
    }
  }
}
