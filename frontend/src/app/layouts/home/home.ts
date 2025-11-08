import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Chatbot } from '../../components/chatbot/chatbot';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Footer } from '../../components/footer/footer';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { FilterOptions, ProviderBasic, Color } from '../../types'; // tipos
import { CardFurniture } from '../../components/card-furniture/card-furniture';
import { Scanner } from '../../components/scanner/scanner';
import { DifficultyLabels } from '../../utils/difficulty-labels';

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink, Footer, CommonModule, FilterPanelComponent, CardFurniture, Scanner],
  templateUrl: './home.html',
  //styleUrl: './home.css'
})
export class Home implements OnInit {
  categories: any[] = [];
  furnitures: any[] = []; //crear tipo para "furniture"
  providers: ProviderBasic[] = [];
  colors: Color[] = [];

  isFilterModalOpen = false; // filter
  activeFiltersCount = 0; // filter
   isQrScannerOpen = false;
  difficultyLabels = DifficultyLabels;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerCatalogo();
    this.loadProviders(); // filter
    this.loadColors(); // filter
  }

  obtenerCatalogo() {
    this.apiService.getFurnitures().subscribe(data => {
      console.log('Catálogo de muebles:', data);
      this.furnitures = data.data; //muebles al array
    }, error => {
      console.error('Error al obtener el catálogo de muebles:', error);
    });
  }


  obtenerCategorias() {
    this.apiService.getCategories().subscribe(data => {
      console.log('Categorías:', data);
      this.categories = data.data; //categorias al array
    }, error => {
      console.error('Error al obtener las categorías:', error);
    });
  }

  loadProviders() {
    this.apiService.getProviders().subscribe({
      next: (response) => {
        this.providers = Object.values(response.data);
        //this.providers = response.data;
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
      }
    });
  }

  loadColors() {
    this.apiService.getColors().subscribe({
      next: (response) => {
        this.colors = Object.values(response.data);
      },
      error: (error) => {
        console.error('Error al cargar proveedores:', error);
      }
    });
  }

  openFilterModal() {
    console.log('Botón de filtro clickeado');
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    this.isFilterModalOpen = false;
  }

  onApplyFilters(filters: FilterOptions) {
    this.apiService.getFilteredFurniture(filters).subscribe({
      next: (response) => {
        this.furnitures = response.data;
        this.calculateActiveFilters(filters);
      },
      error: (error) => {
        console.error('Error al filtrar muebles:', error);
      }
    });
  }

  calculateActiveFilters(filters: FilterOptions) {
    this.activeFiltersCount = 
      (filters.color_ids?.length || 0) + 
      (filters.difficulties?.length || 0) + 
      (filters.provider_ids?.length || 0);
  }

  onQrScanned(code: string) {
    console.log('Código QR escaneado:', code);
    
    // Aquí implementas tu lógica según el tipo de QR
    // Ejemplo 1: Si el QR contiene un ID de mueble
    if (code.includes('furniture')) {
      const furnitureId = code.split('/').pop();
      this.apiService.getFurnitureById(furnitureId!).subscribe({
        next: (response) => {
          const furniture = response.data;
          alert(`Mueble escaneado: ${furniture.name}`);
          // Aquí podrías navegar a la página del mueble o mostrar más detalles
        }
        ,error: (error) => {
          console.error('Error al obtener el mueble escaneado:', error);
        }
      });
    } 
    // Ejemplo 2: Si es una clave de configuración
    else if (code.startsWith('CONFIG:')) {
      const configKey = code.replace('CONFIG:', '');
      this.processConfiguration(configKey);
    }
    // Ejemplo 3: Mostrar el código
    else {
      alert(`Código escaneado: ${code}`);
    }
  }

  processConfiguration(configKey: string) {
    // Implementa tu lógica de configuración
    console.log('Procesando configuración:', configKey);
    // Ejemplo: this.apiService.applyConfiguration(configKey).subscribe(...)
  }
}
