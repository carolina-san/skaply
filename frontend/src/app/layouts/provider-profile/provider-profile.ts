import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileSidebar } from '../../components/private/profile-sidebar/profile-sidebar';
import { GestionMuebles } from '../../components/private/gestion-muebles/gestion-muebles';
import { GestionIncidencias } from '../../components/private/gestion-incidencias/gestion-incidencias';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { Issue } from '../../types/issue.types';

@Component({
  standalone: true,
  selector: 'app-provider-profile',
  imports: [ProfileSidebar, GestionMuebles, GestionIncidencias, CommonModule, FormsModule],
  templateUrl: './provider-profile.html',
  styleUrls: ['./provider-profile.css']
})
export class ProviderProfile implements OnInit {
  activeTab: 'muebles' | 'incidencias' | 'estadisticas' = 'muebles';
  searchText: string = '';
  pendingIssuesCount: number = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadPendingIssuesCount();
  }

  loadPendingIssuesCount(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id) {
      this.apiService.getProviderIssues(currentUser.id, 'pending').subscribe({
        next: (response) => {
          this.pendingIssuesCount = response.data?.length || 0;
        },
        error: (error) => {
          console.error('Error loading issues count:', error);
        }
      });
    }
  }

  setActiveTab(tab: 'estadisticas' | 'muebles' | 'incidencias') {
    this.activeTab = tab;
    if (tab === 'incidencias') {
      // Refrescar el contador cuando se cambia a la pestaña de incidencias
      this.loadPendingIssuesCount();
    }
  }
}
