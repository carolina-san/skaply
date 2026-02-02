import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-muebles',
  imports: [CommonModule],
  templateUrl: './gestion-muebles.html',
  styleUrl: './gestion-muebles.css'
})
export class GestionMuebles {
  furniture: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;

  constructor(private apiService: ApiService) {
    this.fetchFurniture();
  }

  fetchFurniture() {
    this.apiService.getAllFurniture().subscribe(
      (response) => {
        console.log('Furniture fetched successfully:', response);
        this.furniture = response.data || [];
        this.totalItems = this.furniture.length;
      },
      (error) => {
        console.error('Error fetching furniture:', error);
      }
    );
  }

  get paginatedFurniture() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.furniture.slice(start, end);
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
