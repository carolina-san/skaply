import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileSidebar } from '../../components/profile-sidebar/profile-sidebar';
import { GestionMuebles } from '../../components/gestion-muebles/gestion-muebles';
import { GestionIncidencias } from '../../components/gestion-incidencias/gestion-incidencias';

@Component({
  selector: 'app-provider-profile',
  imports: [ProfileSidebar, GestionMuebles, GestionIncidencias, CommonModule, FormsModule],
  templateUrl: './provider-profile.html',
  styleUrls: ['./provider-profile.css']
})
export class ProviderProfile {
  activeTab: 'estadisticas' | 'muebles' | 'incidencias' = 'muebles';
  searchText: string = '';

  setActiveTab(tab: 'estadisticas' | 'muebles' | 'incidencias') {
    this.activeTab = tab;
  }
}
