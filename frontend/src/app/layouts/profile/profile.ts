import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile implements OnInit {
  providers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;

  constructor(private apiService: ApiService, private seo: SeoService) {
    this.fetchProviders();
  }

  ngOnInit() {
    this.seo.setSeo({
      title: `Mi Perfil - Skäply`,
      description: `Gestiona tu perfil y visualiza los proveedores registrados en tu cuenta de Skäply.`,
      canonical: `https://skaply.ovh/perfil`,
      index: false
    });
  }

  fetchProviders() {
    this.apiService.getProviders().subscribe(
      (response) => {
        console.log('Providers fetched successfully:', response);
        this.providers = response.data;
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
