import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileSidebar } from '../../components/private/profile-sidebar/profile-sidebar';
import { GestionMuebles } from '../../components/private/gestion-muebles/gestion-muebles';
import { GestionIncidencias } from '../../components/private/gestion-incidencias/gestion-incidencias';
import { ProviderStats } from '../../components/private/provider-stats/provider-stats';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { UploadForm } from '../../components/private/upload-form/upload-form';

@Component({
  standalone: true,
  selector: 'app-provider-profile',
  imports: [ProfileSidebar, GestionMuebles, GestionIncidencias, ProviderStats, UploadForm,   CommonModule, FormsModule],
  templateUrl: './provider-profile.html',
  styleUrls: ['./provider-profile.css']
})
export class ProviderProfile implements OnInit {
  activeTab: 'muebles' | 'incidencias' | 'estadisticas' | 'subir-mueble'  = 'muebles';
  searchText: string = '';
  pendingIssuesCount: number = 0;
  currentUser: any;

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (this.currentUser?.id) {
        this.loadPendingIssuesCount();
      }
    });
  }

  loadPendingIssuesCount(): void {
    if (this.currentUser?.id) {
      this.apiService.getProviderIssues(this.currentUser.id, 'pending').subscribe({
        next: (response) => {
          this.pendingIssuesCount = response.data?.length || 0;
        },
        error: (error) => {
          console.error('Error loading issues count:', error);
        }
      });
    }
  }

  setActiveTab(tab: 'estadisticas' | 'muebles' | 'incidencias' | 'subir-mueble') {
    this.activeTab = tab;
    if (tab === 'incidencias') {
      // Refrescar el contador cuando se cambia a la pestaña de incidencias
      this.loadPendingIssuesCount();
    }
  }
}
