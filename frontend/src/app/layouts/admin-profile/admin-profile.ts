import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../services/seo.service';
import { ProfileSidebar } from '../../components/profile-sidebar/profile-sidebar';
import { GestionProveedores } from '../../components/gestion-proveedores/gestion-proveedores';
import { GestionMuebles } from '../../components/gestion-muebles/gestion-muebles';
import { GestionSolicitudes } from '../../components/gestion-solicitudes/gestion-solicitudes';
import { GestionIncidencias } from '../../components/gestion-incidencias/gestion-incidencias';
import { Issue } from '../../types/issue.types';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileSidebar, GestionProveedores, GestionMuebles, GestionSolicitudes, GestionIncidencias],
  templateUrl: './admin-profile.html',
  styleUrls: ['./admin-profile.css']
})
export class AdminProfile implements OnInit {
  activeTab: 'dashboard' | 'proveedores' | 'solicitudes' | 'muebles' | 'incidencias' = 'proveedores'; // Default tab
  searchText: string = '';
  pendingIssuesCount: number = 0;

  constructor(private seo: SeoService, private apiService: ApiService) {
  }

  ngOnInit() {
    this.seo.setSeo({
      title: `Mi Perfil - Skäply`,
      description: `Gestiona tu perfil y visualiza los proveedores registrados en tu cuenta de Skäply.`,
      canonical: `https://skaply.ovh/profile`,
      index: false
    });
    this.loadPendingIssuesCount();
  }

  loadPendingIssuesCount() {
    this.apiService.getAllIssues('pending').subscribe({
      next: (response) => {
        this.pendingIssuesCount = response.data?.length || 0;
      },
      error: (error) => {
        console.error('Error loading pending issues count:', error);
      }
    });
  }

  setActiveTab(tab: 'dashboard' | 'proveedores' | 'solicitudes' | 'muebles' | 'incidencias') {
    this.activeTab = tab;
    if (tab === 'incidencias') {
      this.loadPendingIssuesCount();
    }
  }
}
