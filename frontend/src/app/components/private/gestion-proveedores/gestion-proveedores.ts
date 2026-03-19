import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Modal } from '../../UI/modal/modal';
import { EditUserModal } from '../edit-user-modal/edit-user-modal';
import { Pagination } from '../pagination/pagination';
import { SortButton } from '../../UI/sort-button/sort-button';

@Component({
  selector: 'app-gestion-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, EditUserModal, Pagination, SortButton],
  templateUrl: './gestion-proveedores.html',
  styleUrl: './gestion-proveedores.css'
})
export class GestionProveedores implements OnInit, OnChanges {
  @Input() searchText: string = '';

  providers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;
  selectedVisibility: boolean | null = null;
  selectedEnabled: boolean | null = null;
  orderBy: string = '';
  orderDir: string = '';

  // Modal de confirmación
  isDeleteModalOpen: boolean = false;
  isEditModalOpen: boolean = false;
  providerToDelete: any = null;
  isInfoModalOpen: boolean = false;
  infoTitle: string = '';
  infoMessage: string = '';

  // Notificaciones
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Usuario
  currentUser: any = null;
  selectedProvider: any = null;
  isSubmitting: boolean = false;

  constructor(
    private apiService: ApiService
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchProviders();
    }
  }

  ngOnInit() {
    this.currentUser = { role: 'admin' };
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }

    this.fetchProviders();
  }

  onVisibilityChange() {
    this.currentPage = 1;
    this.fetchProviders();
  }

  onEnabledChange() {
    this.currentPage = 1;
    this.fetchProviders();
  }

  onOrderByChange(column: string) {
    if (this.orderBy === column) {
      if (this.orderDir === 'ASC') {
        this.orderDir = 'DESC';
      } else if (this.orderDir === 'DESC') {
        this.orderBy = '';
        this.orderDir = '';
      } else {
        this.orderDir = 'ASC';
      }
    } else {
      this.orderBy = column;
      this.orderDir = 'ASC';
    }
    this.currentPage = 1;
    this.fetchProviders();
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = null;
    setTimeout(() => this.errorMessage = null, 3000);
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = null;
    setTimeout(() => this.successMessage = null, 3000);
  }

  fetchProviders() {
    this.apiService.getProviders(this.currentPage, this.itemsPerPage, this.searchText, this.selectedVisibility, this.selectedEnabled, 'approved', this.orderBy, this.orderDir).subscribe(
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

  openDeleteModal(provider: any) {
    this.providerToDelete = provider;
    this.isDeleteModalOpen = true;
  }

  closeDeleteModal() {
    this.isDeleteModalOpen = false;
    this.providerToDelete = null;
  }

  confirmDeleteProvider() {
    if (!this.providerToDelete) return;

    this.apiService.deleteProvider(this.providerToDelete.id).subscribe(
      (response) => {
        console.log('Provider deleted successfully:', response);
        this.showSuccess('Proveedor eliminado correctamente');
        this.closeDeleteModal();
        this.fetchProviders();
      },
      (error) => {
        console.error('Error deleting provider:', error);
        this.showError('Error al eliminar el proveedor');
        this.closeDeleteModal();
      }
    );
  }

  // --- MÉTODOS DE EDICIÓN ---

  openEditModal(provider: any) {
    this.selectedProvider = provider;
    this.errorMessage = null;
    this.successMessage = null;
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedProvider = null;
    this.errorMessage = null;
    this.successMessage = null;
  }

  onSaveProvider(updateData: any) {
    if (!this.selectedProvider) return;

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    if (Object.keys(updateData).length === 0) {
      this.isSubmitting = false;
      return;
    }
    if (updateData.password) {
      this.apiService.updateProviderPassword(this.selectedProvider.id, updateData.password).subscribe(
        (response) => {
          this.successMessage = 'Proveedor actualizado correctamente';
          this.isSubmitting = false;

          setTimeout(() => {
            this.closeEditModal();
            this.fetchProviders();
          }, 1500);
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Error updating provider password:', error);
          this.errorMessage = error.error?.message || 'Error al actualizar la contraseña del proveedor';
        }
      );
    }

    this.apiService.updateProvider(this.selectedProvider.id, updateData).subscribe(
      (response) => {
        this.successMessage = 'Proveedor actualizado correctamente';
        this.isSubmitting = false;

        setTimeout(() => {
          this.closeEditModal();
          this.fetchProviders();
        }, 1500);
      },
      (error) => {
        if (!updateData.password) {
          this.isSubmitting = false;
          console.error('Error updating provider:', error);
          this.errorMessage = error.error?.message || 'Error al actualizar el proveedor';
        }
      }
    );
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
    this.apiService.updateProviderVisibility(provider.id, newStatus).subscribe(
      () => {
        provider.visible = newStatus;
        this.infoTitle = 'Estado actualizado';
        this.infoMessage = newStatus
          ? `Se ha mostrado al proveedor "${provider.company_name}".`
          : `Se ha ocultado al proveedor "${provider.company_name}".`;
        this.isInfoModalOpen = true;
        this.fetchProviders();
      },
      (error) => {
        console.error('Error updating provider visibility:', error);
        this.showError('Error al actualizar la visibilidad del proveedor. Verifica si está habilitado.');
      }
    );
  }

  toggleEnabled(provider: any) {
    const newStatus = !provider.enabled;
    this.apiService.updateProviderEnabled(provider.id, newStatus).subscribe(
      () => {
        provider.enabled = newStatus;
        this.infoTitle = 'Estado actualizado';
        this.infoMessage = newStatus
          ? `Se ha habilitado al proveedor "${provider.company_name}".`
          : `Se ha bloqueado al proveedor "${provider.company_name}".`;
        this.isInfoModalOpen = true;
        this.fetchProviders();
      },
      (error) => {
        console.error('Error updating provider enabled status:', error);
        this.showError('Error al actualizar el estado del proveedor');
      }
    );
  }

  closeInfoModal() {
    this.isInfoModalOpen = false;
    this.infoTitle = '';
    this.infoMessage = '';
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
