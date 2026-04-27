import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';
import { Furniture } from '../../types/furniture.types';
import { Header } from '../../components/UI/header/header';
import { Footer } from '../../components/UI/footer/footer';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-open-data',
  standalone: true,
  imports: [CommonModule, Header, Footer],
  templateUrl: './open-data.html',
  styleUrl: './open-data.css'
})
export class OpenData implements OnInit {
  furnitureList: Furniture[] = [];
  categories: any[] = [];
  providers: any[] = [];
  loading = true;
  visibleCount = 5;

  get visibleFurnitureList(): Furniture[] {
    return this.furnitureList.slice(0, this.visibleCount);
  }

  showMore(): void {
    this.visibleCount = this.furnitureList.length;
  }

  datasetMetadata = {
    name: 'Skäply Furniture Dataset',
    description: 'Conjunto de datos abierto que contiene información estadística y descriptiva sobre los muebles disponibles en la plataforma Skäply.',
    publisher: 'Grupo ABP Lynk',
    license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
    formats: ['CSV', 'JSON'],
    creationDate: '2026-04-27',
    updateFrequency: 'Mensual',
    language: 'Español',
    observations: 'El dataset incluye identificadores, referencias, nombres, descripciones cortas, colores, dificultad de montaje, y el identificador del proveedor.'
  };

  constructor(
    private apiService: ApiService,
    private seoService: SeoService
  ) {}

  ngOnInit(): void {
    // Configurar SEO y Schema.org
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://skaply.com/#organization",
          "name": "Grupo ABP Lynk",
          "url": "https://skaply.com/"
        },
        {
          "@type": "Dataset",
          "@id": "https://skaply.com/open-data/#dataset",
          "name": this.datasetMetadata.name,
          "description": this.datasetMetadata.description,
          "publisher": {
            "@id": "https://skaply.com/#organization"
          },
          "license": "https://creativecommons.org/licenses/by/4.0/",
          "dateCreated": this.datasetMetadata.creationDate,
          "inLanguage": "es",
          "distribution": [
            {
              "@type": "DataDownload",
              "encodingFormat": "text/csv",
              "contentUrl": "https://skaply.com/open-data"
            },
            {
              "@type": "DataDownload",
              "encodingFormat": "application/json",
              "contentUrl": "https://skaply.com/open-data"
            }
          ]
        },
        {
          "@type": "DataCatalog",
          "@id": "https://skaply.com/open-data/#catalog",
          "name": "Catálogo de Datos Abiertos de Skäply",
          "description": "Repositorio de datos abiertos de la organización Grupo ABP Lynk",
          "publisher": {
            "@id": "https://skaply.com/#organization"
          },
          "dataset": [
            {
              "@id": "https://skaply.com/open-data/#dataset"
            }
          ]
        }
      ]
    };

    this.seoService.setSeo({
      title: 'Datos Abiertos - Skäply',
      description: this.datasetMetadata.description,
      canonical: 'https://skaply.com/open-data',
      schema: schema
    });

    forkJoin({
      furniture: this.apiService.getAllFurniture(),
      categories: this.apiService.getCategories(),
      providers: this.apiService.getVisibleProviders()
    }).subscribe({
      next: (results: any) => {
        const data = results.furniture;
        if (data && data.data) {
           this.furnitureList = data.data;
        } else if (Array.isArray(data)) {
           this.furnitureList = data;
        } else if (data && data.furniture) {
           this.furnitureList = data.furniture;
        }

        if (results.categories && results.categories.data) {
          this.categories = results.categories.data;
        }

        if (results.providers && results.providers.data) {
          this.providers = Object.values(results.providers.data);
        }

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching data', err);
        this.loading = false;
      }
    });
  }

  downloadCSV(): void {
    if (!this.furnitureList.length) return;
    
    const headers = ['ID', 'Referencia', 'Nombre', 'Descripcion', 'Color', 'Dificultad', 'Proveedor', 'Categoria'];
    
    const rows = this.furnitureList.map(item => [
      item.id,
      `"${item.reference_number || ''}"`,
      `"${item.name || ''}"`,
      `"${item.short_description ? item.short_description.replace(/"/g, '""') : ''}"`,
      `"${item.color_name || ''}"`,
      `"${this.getDifficultyLabel(item.difficulty)}"`,
      `"${this.getProviderName(item.provider_id) || ''}"`,
      `"${this.getCategoryName(item.category_id) || ''}"`
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    this.triggerDownload(csvContent, 'text/csv;charset=utf-8;', 'skaply-muebles-dataset.csv');
  }

  downloadJSON(): void {
    if (!this.furnitureList.length) return;
    
    const jsonContent = JSON.stringify(this.furnitureList, null, 2);
    this.triggerDownload(jsonContent, 'application/json;charset=utf-8;', 'skaply-muebles-dataset.json');
  }

  private triggerDownload(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  getDifficultyLabel(difficulty: string): string {
    switch(difficulty) {
      case 'low': return 'Fácil';
      case 'medium': return 'Medio';
      case 'high': return 'Difícil';
      default: return difficulty || '';
    }
  }

  getCategoryName(id: number): string {
    return this.categories.find(c => c.id === id)?.name || id.toString();
  }

  getProviderName(id: number): string {
    return this.providers.find(p => p.id === id)?.company_name || id.toString();
  }
}
