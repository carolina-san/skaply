import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../services/seo.service';
import { ProfileSidebar } from '../../components/private/profile-sidebar/profile-sidebar';
import { GestionProveedores } from '../../components/private/gestion-proveedores/gestion-proveedores';
import { GestionMuebles } from '../../components/private/gestion-muebles/gestion-muebles';
import { GestionSolicitudes } from '../../components/private/gestion-solicitudes/gestion-solicitudes';
import { GestionIncidencias } from '../../components/private/gestion-incidencias/gestion-incidencias';
import { Stats } from '../../components/private/stats/stats';
import { Reviews } from '../../components/private/reviews/reviews';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileSidebar, GestionProveedores, GestionMuebles, GestionSolicitudes, GestionIncidencias, Stats, Reviews],
  templateUrl: './admin-profile.html',
  styleUrls: ['./admin-profile.css']
})
export class AdminProfile implements OnInit {
  activeTab: 'dashboard' | 'proveedores' | 'solicitudes' | 'muebles' | 'incidencias' | 'reviews' = 'proveedores'; // Default tab
  searchText: string = '';
  escalatedIssuesCount: number = 0;
  pendingProvidersCount: number = 0;

  constructor(private seo: SeoService, private apiService: ApiService) {
  }

  ngOnInit() {
    this.seo.setSeo({
      title: `Mi Perfil - Skäply`,
      description: `Gestiona tu perfil y visualiza los proveedores registrados en tu cuenta de Skäply.`,
      canonical: `https://skaply.ovh/profile`,
      index: false
    });
    this.loadEscalatedIssuesCount();
    this.loadPendingProvidersCount();
  }



  loadEscalatedIssuesCount() {
    this.apiService.getAllIssues('escalated').subscribe({
      next: (response) => {
        this.escalatedIssuesCount = response.data?.length || 0;
      },
      error: (error) => {
        console.error('Error loading escalated issues count:', error);
      }
    });
  }

  loadPendingProvidersCount() {
    this.apiService.getProviders(1, 1000, '', null, null, 'pending').subscribe({
      next: (response) => {
        this.pendingProvidersCount = response.data?.length || 0;
      },
      error: (error) => {
        console.error('Error loading pending providers count:', error);
      }
    });
  }

  setActiveTab(tab: 'dashboard' | 'proveedores' | 'solicitudes' | 'muebles' | 'incidencias' | 'reviews') {
    this.activeTab = tab;
    if (tab === 'incidencias') {
      this.loadEscalatedIssuesCount();
    }
  }
}
