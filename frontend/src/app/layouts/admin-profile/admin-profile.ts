import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeoService } from '../../services/seo.service';
import { ProfileSidebar } from '../../components/profile-sidebar/profile-sidebar';
import { GestionProveedores } from '../../components/gestion-proveedores/gestion-proveedores';
import { GestionMuebles } from '../../components/gestion-muebles/gestion-muebles';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ProfileSidebar, GestionProveedores, GestionMuebles],
  templateUrl: './admin-profile.html',
  styleUrls: ['./admin-profile.css']
})
export class AdminProfile implements OnInit {
  activeTab: 'dashboard' | 'proveedores' | 'solicitudes' | 'muebles' = 'proveedores'; // Default tab
  searchText: string = '';

  constructor(private seo: SeoService, private apiService: ApiService) {
  }

  ngOnInit() {
    this.seo.setSeo({
      title: `Mi Perfil - Skäply`,
      description: `Gestiona tu perfil y visualiza los proveedores registrados en tu cuenta de Skäply.`,
      canonical: `https://skaply.ovh/profile`,
      index: false
    });
  }

  setActiveTab(tab: 'dashboard' | 'proveedores' | 'solicitudes' | 'muebles') {
    this.activeTab = tab;
  }
}
