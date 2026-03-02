import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Issue, IssueStatus } from '../../types/issue.types';
import { User } from '../../services/auth.service';
import { Modal } from '../modal/modal';

@Component({
  selector: 'app-gestion-incidencias',
  imports: [CommonModule, FormsModule, Modal],
  templateUrl: './gestion-incidencias.html',
  styleUrl: './gestion-incidencias.css'
})
export class GestionIncidencias implements OnInit {
  issues: Issue[] = [];
  filteredIssues: Issue[] = [];
  paginatedIssues: Issue[] = [];
  providers: any[] = [];
  currentUser: User | null = null;

  // Filtros
  selectedStatus: IssueStatus | null = null;
  selectedProviderId: number | null = null;

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  pageNumbers: number[] = [];
  startItem: number = 0;
  endItem: number = 0;

  // Modales
  isResolveModalOpen: boolean = false;
  isEscalateModalOpen: boolean = false;
  selectedIssue: Issue | null = null;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadIssues();
    if (this.currentUser?.role === 'admin') {
      this.loadProviders();
    }
  }

  loadIssues(): void {
    if (this.currentUser?.role === 'admin') {
      this.apiService.getAllIssues().subscribe({
        next: (response) => {
          this.issues = response.data || [];
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading issues:', error);
        }
      });
    } else if (this.currentUser?.role === 'provider') {
      this.apiService.getProviderIssues(this.currentUser.id!).subscribe({
        next: (response) => {
          this.issues = response.data || [];
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading provider issues:', error);
        }
      });
    }
  }

  loadProviders(): void {
    this.apiService.getProviders(1, 1000, '', null, 'approved').subscribe({
      next: (response) => {
        this.providers = response.data || [];
      },
      error: (error) => {
        console.error('Error loading providers:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.issues];

    // Filtro por estado
    if (this.selectedStatus) {
      filtered = filtered.filter(issue => issue.status === this.selectedStatus);
    }

    // Filtro por proveedor (solo admin)
    if (this.selectedProviderId && this.currentUser?.role === 'admin') {
      filtered = filtered.filter(issue => issue.provider_id === this.selectedProviderId);
    }

    this.filteredIssues = filtered;
    this.totalItems = filtered.length;
    this.calculatePagination();
    this.updatePaginatedIssues();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onProviderChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  calculatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.pageNumbers = [];
    
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }

    this.startItem = this.totalItems > 0 ? (this.currentPage - 1) * this.itemsPerPage + 1 : 0;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  updatePaginatedIssues(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedIssues = this.filteredIssues.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.calculatePagination();
      this.updatePaginatedIssues();
    }
  }

  getStatusLabel(status?: IssueStatus): string {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'resolved':
        return 'Resuelta';
      case 'escalated':
        return 'Escalada';
      default:
        return 'Desconocido';
    }
  }

  // Modal de resolver
  openResolveModal(issue: Issue): void {
    this.selectedIssue = issue;
    this.isResolveModalOpen = true;
  }

  closeResolveModal(): void {
    this.isResolveModalOpen = false;
    this.selectedIssue = null;
  }

  confirmResolve(): void {
    if (this.selectedIssue && this.selectedIssue.id && this.currentUser) {
      const resolvedBy = this.currentUser.email || this.currentUser.company_name || 'Unknown';
      this.apiService.resolveIssue(this.selectedIssue.id, resolvedBy).subscribe({
        next: () => {
          this.closeResolveModal();
          this.loadIssues();
        },
        error: (error) => {
          console.error('Error resolving issue:', error);
        }
      });
    }
  }

  // Modal de escalar
  openEscalateModal(issue: Issue): void {
    this.selectedIssue = issue;
    this.isEscalateModalOpen = true;
  }

  closeEscalateModal(): void {
    this.isEscalateModalOpen = false;
    this.selectedIssue = null;
  }

  confirmEscalate(): void {
    if (this.selectedIssue && this.selectedIssue.id) {
      this.apiService.escalateIssue(this.selectedIssue.id).subscribe({
        next: () => {
          this.closeEscalateModal();
          this.loadIssues();
        },
        error: (error) => {
          console.error('Error escalating issue:', error);
        }
      });
    }
  }
}
