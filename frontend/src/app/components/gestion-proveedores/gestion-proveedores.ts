import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-gestion-proveedores',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, Modal],
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

  // Modal de confirmación
  isDeleteModalOpen: boolean = false;
  isEditModalOpen: boolean = false;
  providerToDelete: any = null;

  // Notificaciones
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Formulario y Usuario
  editForm!: FormGroup;
  currentUser: any = null;
  selectedProvider: any = null;
  originalData: any = {};
  isSubmitting: boolean = false;
  hasChanges: boolean = false;

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchProviders();
    }
  }

  ngOnInit() {
    this.currentUser = { role: 'admin' }; // Dummy for simulation if they don't have AuthService yet, user template requires it
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.currentUser = JSON.parse(storedUser);
    }

    this.fetchProviders();
    this.onFormChanges();
  }

  initForm() {
    this.editForm = this.fb.group({
      company_name: [''],
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      password: ['', [Validators.minLength(12)]]
    });
  }

  onFormChanges() {
    this.editForm.valueChanges.subscribe(val => {
      this.hasChanges = Object.keys(this.originalData).some(key => {
        if (key === 'password' && val[key] === '') return false;
        return val[key] !== this.originalData[key];
      });
    });
  }

  onVisibilityChange() {
    this.currentPage = 1;
    this.fetchProviders();
  }

  onEnabledChange() {
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
    this.apiService.getProviders(this.currentPage, this.itemsPerPage, this.searchText, this.selectedVisibility, this.selectedEnabled, 'approved').subscribe(
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
    this.hasChanges = false;

    this.editForm.patchValue({
      company_name: provider.company_name || '',
      name: provider.name || '',
      email: provider.email || '',
      telephone: provider.telephone || '',
      password: ''
    });

    this.originalData = { ...this.editForm.value, password: '' };
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.selectedProvider = null;
    this.editForm.reset();
    this.errorMessage = null;
    this.successMessage = null;
  }

  onSubmit() {
    if (this.editForm.invalid || !this.selectedProvider || !this.hasChanges) return;

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const formValues = this.editForm.value;
    const updateData: any = {};

    Object.keys(formValues).forEach(key => {
      if (formValues[key] !== this.originalData[key] && formValues[key] !== '') {
        updateData[key] = formValues[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      this.isSubmitting = false;
      return;
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
        this.isSubmitting = false;
        console.error('Error updating provider:', error);
        this.errorMessage = error.error?.message || 'Error al actualizar el proveedor';
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
    this.apiService.updateProvider(provider.id, { visible: newStatus }).subscribe(
      (response) => {
        console.log('Provider visibility updated successfully:', response);
        this.showSuccess(newStatus ? 'Proveedor visible en el catálogo' : 'Proveedor oculto en el catálogo');
        provider.visible = newStatus;
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
    this.apiService.updateProvider(provider.id, { enabled: newStatus }).subscribe(
      (response) => {
        console.log('Provider enabled status updated successfully:', response);
        this.showSuccess(newStatus ? 'Proveedor habilitado correctamente' : 'Proveedor bloqueado correctamente');
        provider.enabled = newStatus;
        this.fetchProviders();
      },
      (error) => {
        console.error('Error updating provider enabled status:', error);
        this.showError('Error al actualizar el estado del proveedor');
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
