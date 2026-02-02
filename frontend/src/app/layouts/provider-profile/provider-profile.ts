import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileSidebar } from '../../components/profile-sidebar/profile-sidebar';
import { GestionMuebles } from '../../components/gestion-muebles/gestion-muebles';

@Component({
  selector: 'app-provider-profile',
  imports: [ProfileSidebar, GestionMuebles, CommonModule],
  templateUrl: './provider-profile.html',
  styleUrls: ['./provider-profile.css']
})
export class ProviderProfile {
  activeTab: 'estadisticas' | 'muebles' | 'incidencias' = 'muebles';

  setActiveTab(tab: 'estadisticas' | 'muebles' | 'incidencias') {
    this.activeTab = tab;
  }
}
