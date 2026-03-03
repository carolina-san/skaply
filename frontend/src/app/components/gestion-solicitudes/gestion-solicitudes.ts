import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-gestion-solicitudes',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './gestion-solicitudes.html',
  styleUrl: './gestion-solicitudes.css'
})
export class GestionSolicitudes implements OnInit, OnChanges {
  @Input() searchText: string = '';

  providers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 6;
  totalItems: number = 0;

  // Modal de confirmación
  isApproveModalOpen: boolean = false;
  isRejectModalOpen: boolean = false;
  selectedProvider: any = null;

  constructor(private apiService: ApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchPendingProviders();
    }
  }

  ngOnInit() {
    this.fetchPendingProviders();
  }

  fetchPendingProviders() {
    this.apiService.getProviders(this.currentPage, this.itemsPerPage, this.searchText, null, null, 'pending').subscribe(
      (response) => {
        console.log('Pending providers fetched successfully:', response);
        this.providers = response.data;
        if (response.meta) {
          this.totalItems = response.meta.total;
        } else {
          this.totalItems = response.data.length;
        }
      },
      (error) => {
        console.error('Error fetching pending providers:', error);
      }
    );
  }

  openApproveModal(provider: any) {
    this.selectedProvider = provider;
    this.isApproveModalOpen = true;
  }

  closeApproveModal() {
    this.isApproveModalOpen = false;
    this.selectedProvider = null;
  }

  confirmApprove() {
    if (!this.selectedProvider) return;

    this.apiService.approveProvider(this.selectedProvider.id).subscribe(
      (response) => {
        console.log('Provider approved:', response);
        this.closeApproveModal();
        this.fetchPendingProviders();
      },
      (error) => {
        console.error('Error approving provider:', error);
        alert('Error al aprobar la solicitud');
        this.closeApproveModal();
      }
    );
  }

  openRejectModal(provider: any) {
    this.selectedProvider = provider;
    this.isRejectModalOpen = true;
  }

  closeRejectModal() {
    this.isRejectModalOpen = false;
    this.selectedProvider = null;
  }

  confirmReject() {
    if (!this.selectedProvider) return;

    this.apiService.rejectProvider(this.selectedProvider.id).subscribe(
      (response) => {
        console.log('Provider rejected:', response);
        this.closeRejectModal();
        this.fetchPendingProviders();
      },
      (error) => {
        console.error('Error rejecting provider:', error);
        alert('Error al rechazar la solicitud');
        this.closeRejectModal();
      }
    );
  }

  get paginatedProviders() {
    return this.providers;
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
      this.fetchPendingProviders();
    }
  }

  get startItem(): number {
    if (this.totalItems === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
