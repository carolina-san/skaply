import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../../services/auth.service';
import { Modal } from '../../UI/modal/modal';
import { FilterOptions } from '../../../types';
import { Pagination } from '../pagination/pagination';

@Component({
  standalone: true,
  selector: 'app-gestion-muebles',
  imports: [CommonModule, FormsModule, Modal, Pagination],
  templateUrl: './gestion-muebles.html',
  styleUrl: './gestion-muebles.css'
})
export class GestionMuebles implements OnInit, OnChanges {
  @Input() searchText: string = '';

  filters: FilterOptions = {};
  furniture: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;
  currentUser: User | null = null;

  // Modal
  isEditModalOpen: boolean = false;
  isDeleteModalOpen: boolean = false;
  selectedFurniture: any = null;
  furnitureToDelete: any = null;
  editForm: any = {
    name: '',
    short_description: '',
    color_id: null,
    category_id: null,
    image_url: '',
    difficulty: 'low',
    required_people: 1
  };
  originalEditForm: any = {};

  // Opciones para los selects
  categories: any[] = [];
  colors: any[] = [];
  providers: any[] = []; // Lista de proveedores para el select
  selectedProviderId: number | null = null; // Filtro de proveedor seleccionado
  selectedCategoryId: number | null = null; // Filtro de categoría seleccionado
  selectedVisibility: boolean | null = null; // Filtro de visibilidad seleccionado

  difficulties = [
    { value: 'low', label: 'Baja' },
    { value: 'medium', label: 'Media' },
    { value: 'high', label: 'Alta' }
  ];

  constructor(private apiService: ApiService, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.fetchFurniture();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchFurniture(); // Ensure fetch is called on search text change if dealing with server-side filter
    }
  }

  ngOnInit() {
    this.loadCategories();
    this.loadColors();
    if (this.authService.getCurrentUser()?.role === 'admin') {
      this.loadProviders();
    }
  }

  loadCategories() {
    this.apiService.getCategories().subscribe(
      (response) => {
        this.categories = response.data || [];
      },
      (error) => {
        console.error('Error loading categories:', error);
      }
    );
  }

  loadColors() {
    this.apiService.getColors().subscribe(
      (response) => {
        this.colors = response.data || [];
      },
      (error) => {
        console.error('Error loading colors:', error);
      }
    );
  }

  loadProviders() {
    this.apiService.getProviders(1, 1000, '', null, null, 'approved').subscribe( // Loading all approved providers for dropdown
      (response) => {
        this.providers = response.data || [];
      },
      (error) => {
        console.error('Error loading providers:', error);
      }
    );
  }

  onProviderChange() {
    if (this.selectedProviderId === null) {
      this.filters.provider_ids = [];
    }
    this.currentPage = 1;
    this.fetchFurniture();
  }

  onCategoryChange() {
    if (!this.selectedCategoryId) {
      this.filters.category_ids = [];
    }
    this.currentPage = 1;
    this.fetchFurniture();
  }

  onVisibilityChange() {
    if (this.selectedVisibility === null) {
      this.filters.visible = undefined;

    }
    this.currentPage = 1;
    this.fetchFurniture();
  }

  fetchFurniture() {
    if (!this.currentUser) return;
    if (this.selectedCategoryId) {
      this.filters.category_ids = [this.selectedCategoryId];
    }
    if (this.selectedVisibility) {
      this.filters.visible = this.selectedVisibility;
    }
    this.filters.page = this.currentPage;
    this.filters.limit = this.itemsPerPage;
    this.filters.search = this.searchText;
    // Si es admin
    if (this.currentUser.role === 'admin') {
      if (this.selectedProviderId) {
        this.filters.provider_ids = [this.selectedProviderId];
      }
    }
    // Si es proveedor, obtener solo sus muebles
    else if (this.currentUser.role === 'provider') {
      this.filters.provider_ids = [this.currentUser.id];
    }
    this.apiService.getAllFilteredFurniture(this.filters).subscribe(
      (response) => {
        this.furniture = response.data || [];
        if (response.meta) {
          this.totalItems = response.meta.total;
        } else {
          this.totalItems = this.furniture.length;
        }
      },
      (error) => {
        console.error('Error fetching filtered furniture:', error);
      }
    );

  }

  get filteredFurniture() {
    // Al usar paginación en servidor, furniture ya contiene los datos filtrados y paginados
    return this.furniture;
  }

  get paginatedFurniture() {
    // Al usar paginación en servidor, furniture ya contiene los datos de la página actual
    return this.furniture;
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage); // Usar totalItems del servidor
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchFurniture(); // Fetch al cambiar de página
    }
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems); // Usar totalItems
  }

  toggleVisibility(furniture: any) {
    const newVisibleState = !furniture.visible;

    this.apiService.updateFurniture(furniture.id, { visible: newVisibleState }).subscribe(
      (response) => {
        furniture.visible = newVisibleState;
        this.fetchFurniture();
      },
      (error) => {
        console.error('Error updating visibility:', error);
      }
    );
  }

  openEditModal(furniture: any) {
    this.selectedFurniture = furniture;
    this.editForm = {
      name: furniture.name,
      short_description: furniture.short_description,
      color_id: furniture.color_id,
      category_id: furniture.category_id,
      image_url: furniture.image_url || '',
      difficulty: furniture.difficulty,
      required_people: furniture.required_people || 1
    };
    this.originalEditForm = { ...this.editForm };
    this.isEditModalOpen = true;
  }

  get hasFormChanges(): boolean {
    return JSON.stringify(this.editForm) !== JSON.stringify(this.originalEditForm);
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedFurniture = null;
  }

  saveChanges() {
    if (!this.selectedFurniture) return;

    this.apiService.updateFurniture(this.selectedFurniture.id, this.editForm).subscribe(
      (response) => {
        console.log('Furniture updated:', response);
        Object.assign(this.selectedFurniture, this.editForm);
        const category = this.categories.find(c => c.id === this.editForm.category_id);
        if (category) this.selectedFurniture.category_name = category.name;
        const color = this.colors.find(c => c.id === this.editForm.color_id);
        if (color) {
          this.selectedFurniture.color_name = color.name;
          this.selectedFurniture.color_hex = color.hex;
        }
        this.closeEditModal();
      },
      (error) => {
        console.error('Error updating furniture:', error);
        alert('Error al actualizar el mueble');
      }
    );
  }

  openDeleteModal(furniture: any) {
    this.furnitureToDelete = furniture;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.furnitureToDelete = null;
  }

  confirmDeleteFurniture() {
    if (!this.furnitureToDelete) return;

    this.apiService.deleteFurniture(this.furnitureToDelete.id).subscribe(
      (response) => {
        console.log('Furniture deleted:', response);
        // Eliminar de la lista local
        this.furniture = this.furniture.filter(item => item.id !== this.furnitureToDelete.id);
        this.totalItems = this.furniture.length;
        this.closeDeleteModal();
      },
      (error) => {
        console.error('Error deleting furniture:', error);
        alert('Error al eliminar el mueble');
        this.closeDeleteModal();
      }
    );
  }
}
