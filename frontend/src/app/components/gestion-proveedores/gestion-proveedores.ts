import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-gestion-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-proveedores.html',
  styleUrl: './gestion-proveedores.css'
})
export class GestionProveedores implements OnInit, OnChanges {
  @Input() searchText: string = '';

  providers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;
  selectedVisibility: boolean | null = null;

  constructor(private apiService: ApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchProviders();
    }
  }

  ngOnInit() {
    this.fetchProviders();

  }

  onVisibilityChange() {
    this.currentPage = 1;
    this.fetchProviders();
  }

  fetchProviders() {
    this.apiService.getProviders(this.currentPage, this.itemsPerPage, this.searchText, this.selectedVisibility).subscribe(
      (response) => {
        console.log('Providers fetched successfully:', response);
        this.providers = response.data;
        if (response.meta) {
          this.totalItems = response.meta.total;
        } else {
          this.totalItems = response.data.length;
        }
      },
      (error) => {
        console.error('Error fetching providers:', error);
      }
    );
  }

  deleteProvider(id: number) {
    if (confirm('¿Estás seguro de que quieres eliminar este proveedor?')) {
      this.apiService.deleteProvider(id).subscribe(
        (response) => {
          console.log('Provider deleted successfully:', response);
          this.fetchProviders();
        },
        (error) => {
          alert('Error al eliminar el proveedor');
        }
      );
    }
  }

  // Ya no usamos getters para filtrar localmente
  // get filteredProviders() ... eliminado

  get paginatedProviders() {
    // Retornamos los providers actuales ya que vienen paginados del backend
    return this.providers;
  }

  // Calcular el total de páginas
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Generar array de números de página
  get pageNumbers(): number[] {
    // podriamos limitar esto si hay muchas paginas
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Cambiar página
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.fetchProviders();
    }
  }

  toggleVisibility(provider: any) {
    const newStatus = !provider.visible;
    this.apiService.updateProvider(provider.id, { visible: newStatus }).subscribe(
      (response) => {
        console.log('Provider visibility updated successfully:', response);
        provider.visible = newStatus;
        this.fetchProviders();
      },
      (error) => {
        console.error('Error updating provider visibility:', error);
        alert('Error al actualizar la visibilidad del proveedor');
      }
    );
  }

  // Calcular rango de items mostrados
  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
