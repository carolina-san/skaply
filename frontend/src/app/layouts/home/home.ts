import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Chatbot } from '../../components/chatbot/chatbot';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Footer } from '../../components/footer/footer';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel';
import { FilterOptions, ProviderBasic, Color } from '../../types'; // tipos

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink, Footer, CommonModule, FilterPanelComponent],
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

  // INICIO LOGICA PARA FILTROS
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
  // FIN LÓGICA PARA FILTROS
}
