import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { SeoService } from '../../services/seo.service';
import { ProfileSidebar } from '../../components/profile-sidebar/profile-sidebar';
import { GestionProveedores } from '../../components/gestion-proveedores/gestion-proveedores';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ProfileSidebar, GestionProveedores],
  templateUrl: './admin-profile.html',
  styleUrls: ['./admin-profile.css']
})
export class AdminProfile implements OnInit {
  activeTab: 'dashboard' | 'proveedores' | 'solicitudes' = 'proveedores'; // Default tab

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

  setActiveTab(tab: 'dashboard' | 'proveedores' | 'solicitudes') {
    this.activeTab = tab;
  }
}
