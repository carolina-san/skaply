import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-gestion-muebles',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './gestion-muebles.html',
  styleUrl: './gestion-muebles.css'
})
export class GestionMuebles implements OnInit {
  furniture: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  currentUser: User | null = null;

  // Modal
  isEditModalOpen: boolean = false;
  selectedFurniture: any = null;
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

  ngOnInit() {
    this.loadCategories();
    this.loadColors();
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

  fetchFurniture() {
    if (!this.currentUser) return;

    // Si es admin, obtener todos los muebles
    if (this.currentUser.role === 'admin') {
      this.apiService.getAllFurniture().subscribe(
        (response) => {
          console.log('All furniture fetched successfully:', response);
          this.furniture = response.data || [];
          this.totalItems = this.furniture.length;
        },
        (error) => {
          console.error('Error fetching all furniture:', error);
        }
      );
    } 
    // Si es proveedor, obtener solo sus muebles
    else if (this.currentUser.role === 'provider') {
      this.apiService.getFilteredFurniture({ provider_ids: [this.currentUser.id] }).subscribe(
        (response) => {
          console.log('Provider furniture fetched successfully:', response);
          this.furniture = response.data || [];
          this.totalItems = this.furniture.length;
        },
        (error) => {
          console.error('Error fetching provider furniture:', error);
        }
      );
    }
  }

  get paginatedFurniture() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.furniture.slice(start, end);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  toggleVisibility(furniture: any) {
    const newVisibleState = !furniture.visible;

    this.apiService.updateFurniture(furniture.id, { visible: newVisibleState }).subscribe(
      (response) => {
        furniture.visible = newVisibleState;
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

  deleteFurniture(furniture: any) {
    if (confirm(`¿Estás seguro de que quieres eliminar el mueble "${furniture.name}"?`)) {
      this.apiService.deleteFurniture(furniture.id).subscribe(
        (response) => {
          console.log('Furniture deleted:', response);
          // Eliminar de la lista local
          this.furniture = this.furniture.filter(item => item.id !== furniture.id);
          this.totalItems = this.furniture.length;
        },
        (error) => {
          console.error('Error deleting furniture:', error);
          alert('Error al eliminar el mueble');
        }
      );
    }
  }
}
