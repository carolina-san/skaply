import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  Header,
  Chatbot,
  Footer,
  FilterPanelComponent,
  CardFurniture,
  Scanner
} from '../../components';
import { ApiService } from '../../services/api.service';
import { FilterOptions, ProviderBasic, Color, Furniture } from '../../types'; // tipos
import { DifficultyLabels } from '../../utils/difficulty-labels';

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink, Footer, CommonModule, FormsModule, FilterPanelComponent, CardFurniture, Scanner],
  templateUrl: './home.html',
  //styleUrl: './home.css'
})
export class Home implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  categories: any[] = [];
  // furnitures: any[] = []; //crear tipo para "furniture"
  furnitures: Furniture[] = [];
  providers: ProviderBasic[] = [];
  colors: Color[] = [];

  isFilterModalOpen = false;
  activeFiltersCount = 0;
  isQrScannerOpen = false;
  difficultyLabels = DifficultyLabels;
  selectedCategoryId: number | null = null;
  searchText: string = '';
  previousSearchText: string = '';
  hasSearched: boolean = false;
  activeFilters: FilterOptions = {};

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerCatalogo();
    this.loadProviders();
    this.loadColors();
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

  onSearch() {
    const searchTerm = this.searchText.trim();
    this.searchInput.nativeElement.blur();
    if (searchTerm === '') {
      this.obtenerCatalogo();
      this.selectedCategoryId = null;
      this.hasSearched = false;
      return;
    }
    // Filter by text
    const filters: FilterOptions = {
      search: searchTerm
    };
    this.apiService.getFilteredFurniture(filters).subscribe({
      next: (response) => {
        this.furnitures = response.data;
        this.selectedCategoryId = null;
        this.hasSearched = true;
        this.previousSearchText = searchTerm;        
      },
      error: (error) => {
        console.error('Error al buscar muebles:', error);
      }
    });
  }

  clearSearch() {
    this.searchText = '';
    this.previousSearchText = '';
    this.hasSearched = false;
    this.selectedCategoryId = null;
    this.activeFilters = {};
    this.activeFiltersCount = 0;
    this.obtenerCatalogo();
  }

  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  onSearchBlur() {
    setTimeout(() => {  
      if (!this.hasSearched) {
        this.searchText = '';
      } else if (this.searchText.trim() !== this.previousSearchText) {
        this.searchText = this.previousSearchText;
      }
    }, 100);
  }

  openFilterModal() {
    console.log('Botón de filtro clickeado');
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    this.isFilterModalOpen = false;
  }

  // onApplyFilters(filters: FilterOptions) {
  //   this.searchText = '';
  //   this.previousSearchText = '';
  //   this.hasSearched = false;
  //   this.applyFiltersWithCategory(filters);
  // }

  onApplyFilters(filters: FilterOptions) {
  if (this.hasSearched && this.previousSearchText.trim() !== '') {
    filters.search = this.previousSearchText.trim();
  }
  this.activeFilters = { ...filters };
  this.applyFiltersWithCategory(filters);
  }

  calculateActiveFilters(filters: FilterOptions) {
    this.activeFiltersCount = 
      (filters.color_ids?.length || 0) + 
      (filters.difficulties?.length || 0) + 
      (filters.provider_ids?.length || 0);
  }

  filterByCategory(categoryId: number | null) {
    // Same category selected
    if (this.selectedCategoryId === categoryId) {
      return;
    }
    this.selectedCategoryId = categoryId;
    // "Ver todo"
    if (categoryId === null) {
      this.obtenerCatalogo();
      return;
    }
    // Filter by category
    const filters: FilterOptions = {
      category_ids: [categoryId]
    };
    this.applyFiltersWithCategory(filters);
  }

  private applyFiltersWithCategory(filters: FilterOptions) {
    const completeFilters: FilterOptions = {
      ...filters,
      category_ids: this.selectedCategoryId !== null ? [this.selectedCategoryId] : filters.category_ids
    };
    this.apiService.getFilteredFurniture(completeFilters).subscribe({
      next: (response) => {
        this.furnitures = response.data;
        this.calculateActiveFilters(filters); // without counting category
        this.activeFilters = filters;
      },
      error: (error) => {
        console.error('Error al filtrar muebles:', error);
      }
    });
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



  getColorName(id: number): string {
    return this.colors.find(c => c.id === id)?.name || 'Color';
  }

  getProviderName(id: number): string {
    return this.providers.find(p => p.id === id)?.company_name || 'Proveedor';
  }

  getDifficultyLabel(value: 'low' | 'medium' | 'high'): string {
    return this.difficultyLabels[value] || 'Dificultad';
  }

  removeColorFilter(colorId: number) {
    if (!this.activeFilters.color_ids) return;
    this.activeFilters.color_ids = this.activeFilters.color_ids.filter(id => id !== colorId);
    this.updateFiltersAfterRemoval();
  }

  removeProviderFilter(providerId: number) {
    if (!this.activeFilters.provider_ids) return;
    this.activeFilters.provider_ids = this.activeFilters.provider_ids.filter(id => id !== providerId);
    this.updateFiltersAfterRemoval();
  }

  removeDifficultyFilter(difficulty: 'low' | 'medium' | 'high') {
    if (!this.activeFilters.difficulties) return;
    this.activeFilters.difficulties = this.activeFilters.difficulties.filter(d => d !== difficulty);
    this.updateFiltersAfterRemoval();
  }

  private updateFiltersAfterRemoval() {
    // Recalcula el contador de filtros
    this.calculateActiveFilters(this.activeFilters);

    // Si no queda ningún filtro activo y no hay búsqueda, recarga todo
    const hasAnyFilter = 
      (this.activeFilters.color_ids?.length || 0) > 0 ||
      (this.activeFilters.difficulties?.length || 0) > 0 ||
      (this.activeFilters.provider_ids?.length || 0) > 0;

    if (!hasAnyFilter && !this.hasSearched) {
      this.obtenerCatalogo();
      return;
    }

    // Mantén la búsqueda activa si la hay
    if (this.hasSearched && this.previousSearchText.trim() !== '') {
      this.activeFilters.search = this.previousSearchText.trim();
    }

    // Mantén la categoría activa si la hay
    const completeFilters: FilterOptions = {
      ...this.activeFilters,
      category_ids: this.selectedCategoryId ? [this.selectedCategoryId] : []
    };

    // Llama al backend con los filtros actualizados
    this.apiService.getFilteredFurniture(completeFilters).subscribe({
      next: (response) => {
        this.furnitures = response.data;
      },
      error: (error) => {
        console.error('Error al actualizar muebles tras quitar filtro:', error);
      }
    });
  }
}
