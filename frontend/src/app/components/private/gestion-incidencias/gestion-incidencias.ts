import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Issue, IssueStatus } from '../../../types/issue.types';
import { User } from '../../../services/auth.service';
import { Modal } from '../../UI/modal/modal';
import { Pagination } from '../pagination/pagination';

@Component({
  standalone: true,
  selector: 'app-gestion-incidencias',
  imports: [CommonModule, FormsModule, Modal, Pagination],
  templateUrl: './gestion-incidencias.html',
  styleUrl: './gestion-incidencias.css'
})
export class GestionIncidencias implements OnInit, OnChanges {
  @Input() searchText: string = '';

  issues: Issue[] = [];
  paginatedIssues: Issue[] = [];
  providers: any[] = [];
  currentUser: User | null = null;

  selectedStatus: IssueStatus | null = null;
  selectedProviderId: number | null = null;

  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalItems: number = 0;

  isResolveModalOpen: boolean = false;
  isEscalateModalOpen: boolean = false;
  isDescriptionModalOpen: boolean = false;
  selectedIssue: Issue | null = null;
  selectedDescription: string = '';
  expandedDescriptions: { [key: number]: boolean } = {};

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    // Para admins, establecer filtro predeterminado a escaladas
    if (this.currentUser?.role === 'admin') {
      this.selectedStatus = 'escalated';
      this.loadProviders();
    }
    this.loadIssues();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['searchText']) {
      this.currentPage = 1;
      this.fetchIssues();
    }
  }
  
  fetchIssues(): void {
    if (this.currentUser?.role === 'admin') {
      this.apiService.getAllIssues(
        this.selectedStatus || undefined, 
        this.selectedProviderId || undefined,
        this.searchText || undefined
      ).subscribe({
        next: (response) => {
          this.issues = response.data || [];
          this.totalItems = this.issues.length;
          this.updatePaginatedIssues();
        },
        error: (error) => {
          console.error('Error loading issues:', error);
        }
      });
    } else if (this.currentUser?.role === 'provider') {
      this.apiService.getProviderIssues(
        this.currentUser.id!, 
        this.selectedStatus || undefined,
        this.searchText || undefined
      ).subscribe({
        next: (response) => {
          this.issues = response.data || [];
          this.totalItems = this.issues.length;
          this.updatePaginatedIssues();
        },
        error: (error) => {
          console.error('Error loading provider issues:', error);
        }
      });
    }
  }

  loadIssues(): void {
    this.fetchIssues();
  }

  loadProviders(): void {
    this.apiService.getProviders(1, 1000, '', null, null, 'approved').subscribe({
      next: (response) => {
        this.providers = response.data || [];
      },
      error: (error) => {
        console.error('Error loading providers:', error);
      }
    });
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadIssues();
  }

  onProviderChange(): void {
    this.currentPage = 1;
    this.loadIssues();
  }

  updatePaginatedIssues(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedIssues = this.issues.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedIssues();
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

  // Modal de descripción
  openDescriptionModal(description: string): void {
    this.selectedDescription = description;
    this.isDescriptionModalOpen = true;
  }

  closeDescriptionModal(): void {
    this.isDescriptionModalOpen = false;
    this.selectedDescription = '';
  }
}
