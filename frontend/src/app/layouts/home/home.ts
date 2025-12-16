import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Header,
  Chatbot,
  Footer,
  FilterPanelComponent,
  CardFurniture,
  Scanner,
  Modal
} from '../../components';
import { ApiService } from '../../services/api.service';
import { FilterOptions, ProviderBasic, Color, Furniture } from '../../types';
import { DifficultyLabels } from '../../utils/difficulty-labels';

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink, Footer, CommonModule, FormsModule, FilterPanelComponent, CardFurniture, Scanner, Modal],
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
    private router: Router
  ) { }

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerCatalogo();
    this.loadProviders();
    this.loadColors();
    window.addEventListener("scroll", () => {
      this.scrolled = window.scrollY > 70;
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
    this.router.navigate(['/viewer-3d', this.selectedFurniture.reference_number]);
    this.closeFurnitureModal();
    this.selectedFurniture = null;
  }

  openFurnitureModal(furniture: Furniture) {
    this.selectedFurniture = furniture;
    this.isFurnitureModalOpen = true;
  }

  closeFurnitureModal() {
    this.isFurnitureModalOpen = false;
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
      this.apiService.getFurnitures().subscribe({
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

  getCategoryName(id: number): string {
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