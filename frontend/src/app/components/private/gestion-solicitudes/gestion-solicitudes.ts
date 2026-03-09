import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Modal } from '../../UI/modal/modal';
import { Pagination } from '../pagination/pagination';

@Component({
  standalone: true,
  selector: 'app-gestion-solicitudes',
  imports: [CommonModule, FormsModule, Modal, Pagination],
  templateUrl: './gestion-solicitudes.html',
  styleUrl: './gestion-solicitudes.css'
})
export class GestionSolicitudes implements OnInit, OnChanges {
  @Input() searchText: string = '';

  providers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 8;
  totalItems: number = 0;

  // Modal de confirmación
  isApproveModalOpen: boolean = false;
  isRejectModalOpen: boolean = false;
  selectedProvider: any = null;

  activeFilter: string = 'pending';
  pendingCount: number = 0;
  approvedCount: number = 0;
  rejectedCount: number = 0;

  constructor(private apiService: ApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchProviders();
    }
  }

  ngOnInit() {
    this.fetchProviders();
    this.loadCounts();
  }

  loadCounts() {
    this.apiService.getProviders(1, 1, '', null, null, 'pending').subscribe(res => this.pendingCount = res.meta?.total || res.data?.length || 0);
    this.apiService.getProviders(1, 1, '', null, null, 'approved').subscribe(res => this.approvedCount = res.meta?.total || res.data?.length || 0);
    this.apiService.getProviders(1, 1, '', null, null, 'rejected').subscribe(res => this.rejectedCount = res.meta?.total || res.data?.length || 0);
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.fetchProviders();
  }

  fetchProviders() {
    this.apiService.getProviders(this.currentPage, this.itemsPerPage, this.searchText, null, null, this.activeFilter).subscribe(
      (response) => {
        console.log(`${this.activeFilter} providers fetched successfully:`, response);
        this.providers = response.data;
        if (response.meta) {
          this.totalItems = response.meta.total;
        } else {
          this.totalItems = response.data.length;
        }
      },
      (error) => {
        console.error(`Error fetching ${this.activeFilter} providers:`, error);
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
        this.fetchProviders();
        this.loadCounts();
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
        this.fetchProviders();
        this.loadCounts();
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
      this.fetchProviders();
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
