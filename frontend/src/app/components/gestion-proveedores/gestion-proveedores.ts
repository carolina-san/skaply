import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-gestion-proveedores',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion-proveedores.html',
  styleUrl: './gestion-proveedores.css'
})
export class GestionProveedores implements OnInit {
  providers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.fetchProviders();
  }

  fetchProviders() {
    this.apiService.getProviders().subscribe(
      (response) => {
        console.log('Providers fetched successfully:', response);
        this.providers = response.data;
        this.totalItems = this.providers.length; // Assuming full list is returned, adjust if backend pagination
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

  get paginatedProviders() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.providers.slice(start, end);
  }

  // Calcular el total de páginas
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Generar array de números de página
  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  // Cambiar página
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  // Calcular rango de items mostrados
  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
