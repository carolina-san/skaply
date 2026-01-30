import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import {
  Chatbot,
  Footer,
  FilterPanelComponent,
  CardFurniture,
  Modal
} from '../../components';
import { ApiService } from '../../services/api.service';
import { FilterSharingService } from '../../services/filter-sharing.service';
import { FilterOptions, ProviderBasic, Color, Furniture } from '../../types';
import { DifficultyLabels } from '../../utils/difficulty-labels';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-home',
  imports: [Chatbot, Footer, CommonModule, FormsModule, FilterPanelComponent, CardFurniture, Modal],
  templateUrl: './home.html',
  styleUrl: './home.css'
})

export class Home implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  categories: any[] = [];
  furnitures: Furniture[] = [];
  providers: ProviderBasic[] = [];
  colors: Color[] = [];
  scrolled = false;
  isFilterModalOpen = false;
  activeFiltersCount = 0;
  isQrScannerOpen = false;
  difficultyLabels = DifficultyLabels;
  selectedCategoryId: number | null = null;
  searchText: string = '';
  previousSearchText: string = '';
  hasSearched: boolean = false;
  activeFilters: FilterOptions = {};
  resetFilterToggle: boolean = false;
  isFurnitureModalOpen = false;
  selectedFurniture: Furniture | null = null;
  isIncidenciaModalOpen = false;
  isLoadingFurnitures = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private filterSharingService: FilterSharingService,
    private seo: SeoService
  ) { }

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerCatalogo();
    this.loadProviders();
    this.loadColors();

    // Verificar si hay un mueble en la URL para abrir su modal automáticamente
    this.route.queryParams.subscribe(params => {
      const furnitureRef = params['furniture'];
      if (furnitureRef) {
        this.openFurnitureModalByRef(furnitureRef);
      }
    });

    // Suscribirse a los cambios de categoría desde el chatbot
    this.filterSharingService.selectedCategory$.subscribe(categoryId => {
      if (categoryId !== null) {
        this.selectedCategoryId = categoryId;
        this.obtenerCatalogo();
        this.filterSharingService.clearSelectedCategory();
      }
    });

    window.addEventListener("scroll", () => {
      this.scrolled = window.scrollY > 70;
    });

    this.seo.setSeo({
      title: `Catálogo de muebles disponibles - Skäply`,
      description: `Explora nuestro catálogo de muebles disponibles en Skäply. Encuentra el mueble perfecto para tu espacio y móntalo fácilmente con nuestro manual interactivo 3D.`,
      canonical: `https://skaply.ovh/catalogo`,
      index: true,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        'name': 'Catálogo de Muebles',
        'description': 'Explora nuestro catálogo de muebles disponibles en Skäply. Encuentra el mueble perfecto para tu espacio y móntalo fácilmente con nuestro manual interactivo 3D.',
        'url': 'https://skaply.ovh/catalogo'
      }
    });
  }

  abrirModalIncidencia() {
    this.isIncidenciaModalOpen = true;
  }

  resetIncidenciaForm() {
    this.isIncidenciaModalOpen = false;
  }

  enviarIncidencia(description: string, date: string, user_email: string) {
    if (!this.selectedFurniture) return;
    this.apiService.postIssue(this.selectedFurniture.id, { description, date, user_email }).subscribe({
      next: (response) => {
        alert('Incidencia enviada con éxito.');
      },
      error: (error) => {
        alert('Error al enviar la incidencia.');
      }
    });
  }

  goToViewer3D() {
    if (!this.selectedFurniture) return;
    const ref = this.selectedFurniture.reference_number;
    // Cerrar modal sin limpiar query params (evita conflicto de navegaciones)
    this.isFurnitureModalOpen = false;
    this.selectedFurniture = null;
    // Navegar al visor 3D
    this.router.navigate(['/viewer-3d', ref]);
  }

  openFurnitureModal(furniture: Furniture) {
    this.selectedFurniture = furniture;
    this.isFurnitureModalOpen = true;
  }

  closeFurnitureModal() {
    this.isFurnitureModalOpen = false;
    this.selectedFurniture = null;
    // Limpiar el query param de la URL al cerrar el modal
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  /**
   * Abre el modal de un mueble buscándolo por su reference_number
   * Usado cuando se accede via QR: /catalogo?furniture=F001
   */
  openFurnitureModalByRef(referenceNumber: string) {
    this.apiService.getFurnitureById(referenceNumber).subscribe({
      next: (response) => {
        if (response.data && response.data.length > 0) {
          const furniture = response.data[0];
          this.openFurnitureModal(furniture);
        } else {
          console.error('Mueble no encontrado:', referenceNumber);
        }
      },
      error: (error) => {
        console.error('Error al cargar mueble por referencia:', error);
      }
    });
  }

  /**
   * Función central para cargar el catálogo.
   * Construye los filtros basados en el estado actual y llama a getFilteredFurniture
   */
  obtenerCatalogo() {
    const filters: FilterOptions = {
      ...this.activeFilters,
      category_ids: this.selectedCategoryId !== null ? [this.selectedCategoryId] : (this.activeFilters.category_ids || [])
    };

    // Agregar búsqueda si está activa
    if (this.hasSearched && this.previousSearchText.trim() !== '') {
      filters.search = this.previousSearchText.trim();
    }

    this.isLoadingFurnitures = true;
    if (filters.category_ids?.length === 0 && !filters.difficulties?.length && !filters.provider_ids?.length && !filters.color_ids?.length && !filters.search) {
      this.apiService.getAllFurniture().subscribe({
        next: (response) => {
          this.furnitures = response.data || [];
          this.isLoadingFurnitures = false;
        },
        error: (error) => {
          console.error('Error al obtener el catálogo de muebles:', error);
          this.furnitures = [];
          this.isLoadingFurnitures = false;
        }
      });
    } else {
      this.apiService.getFilteredFurniture(filters).subscribe({
        next: (response) => {
          this.furnitures = response.data || [];
          this.isLoadingFurnitures = false;
        },
        error: (error) => {
          console.error('Error al obtener el catálogo de muebles:', error);
          this.furnitures = [];
          this.isLoadingFurnitures = false;
        }
      });
    }

  }

  obtenerCategorias() {
    this.apiService.getCategories().subscribe(data => {
      this.categories = data.data;
    }, error => {
      console.error('Error al obtener las categorías:', error);
    });
  }

  loadProviders() {
    this.apiService.getVisibleProviders().subscribe({
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
        console.error('Error al cargar colores:', error);
      }
    });
  }

  onSearch() {
    const searchTerm = this.searchText.trim();
    this.searchInput.nativeElement.blur();

    if (searchTerm === '') {
      this.clearSearch();
      return;
    }

    this.hasSearched = true;
    this.previousSearchText = searchTerm;
    this.obtenerCatalogo();
  }

  clearSearch() {
    this.searchText = '';
    this.previousSearchText = '';
    this.hasSearched = false;
    this.obtenerCatalogo();
  }

  onSearchKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  onSearchBlur() {
    this.searchText = '';
  }

  openFilterModal() {
    this.isFilterModalOpen = true;
  }

  closeFilterModal() {
    setTimeout(() => { this.isFilterModalOpen = false; }, 350);
  }

  onApplyFilters(filters: FilterOptions) {
    this.activeFilters = { ...filters };
    this.calculateActiveFilters(this.activeFilters);
    this.obtenerCatalogo();
  }

  calculateActiveFilters(filters: FilterOptions) {
    this.activeFiltersCount =
      (filters.color_ids?.length || 0) +
      (filters.difficulties?.length || 0) +
      (filters.provider_ids?.length || 0);
  }

  filterByCategory(categoryId: number | null) {
    if (this.selectedCategoryId === categoryId) {
      return;
    }
    this.selectedCategoryId = categoryId;
    this.obtenerCatalogo();
  }

  onQrScanned(code: string) {
    console.log('Código QR escaneado:', code);

    if (code.includes('furniture')) {
      const furnitureId = code.split('/').pop();
      this.apiService.getFurnitureById(furnitureId!).subscribe({
        next: (response) => {
          const furniture = response.data;
          alert(`Mueble escaneado: ${furniture.name}`);
        },
        error: (error) => {
          console.error('Error al obtener el mueble escaneado:', error);
        }
      });
    }
    else if (code.startsWith('CONFIG:')) {
      const configKey = code.replace('CONFIG:', '');
      this.processConfiguration(configKey);
    }
    else {
      alert(`Código escaneado: ${code}`);
    }
  }

  processConfiguration(configKey: string) {
    console.log('Procesando configuración:', configKey);
  }

  getColorName(id: number): string {
    return this.colors.find(c => c.id === id)?.name || 'Color';
  }

  getProviderName(id: number): string {
    return this.providers.find(p => p.id === id)?.company_name || 'Proveedor';
  }

  getCategoryName(id: number | null): string {
    if (id === null) return 'Todos los muebles';
    return this.categories.find(c => c.id === id)?.name || 'Categoría';
  }

  getDifficultyLabel(value: 'low' | 'medium' | 'high'): string {
    return this.difficultyLabels[value] || 'Dificultad';
  }

  removeColorFilter(colorId: number) {
    if (!this.activeFilters.color_ids) return;
    this.activeFilters = {
      ...this.activeFilters,
      color_ids: this.activeFilters.color_ids.filter(id => id !== colorId)
    };
    this.updateFiltersAfterRemoval();
  }

  removeProviderFilter(providerId: number) {
    if (!this.activeFilters.provider_ids) return;
    this.activeFilters = {
      ...this.activeFilters,
      provider_ids: this.activeFilters.provider_ids.filter(id => id !== providerId)
    };
    this.updateFiltersAfterRemoval();
  }

  removeDifficultyFilter(difficulty: 'low' | 'medium' | 'high') {
    if (!this.activeFilters.difficulties) return;
    this.activeFilters = {
      ...this.activeFilters,
      difficulties: this.activeFilters.difficulties.filter(d => d !== difficulty)
    };
    this.updateFiltersAfterRemoval();
  }

  private updateFiltersAfterRemoval() {
    this.calculateActiveFilters(this.activeFilters);
    this.obtenerCatalogo();
  }


}