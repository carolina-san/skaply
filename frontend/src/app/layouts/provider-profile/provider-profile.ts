import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProviderPanel } from '../../components/provider-panel/provider-panel';
import { GestionMuebles } from '../../components/gestion-muebles/gestion-muebles';

@Component({
  selector: 'app-provider-profile',
  imports: [ProviderPanel, GestionMuebles, CommonModule],
  templateUrl: './provider-profile.html',
  styleUrls: ['./provider-profile.css']
})
export class ProviderProfile {
  activeTab: 'estadisticas' | 'muebles' | 'incidencias' = 'muebles'; 

  setActiveTab(tab: 'estadisticas' | 'muebles' | 'incidencias') {
    this.activeTab = tab;
  }
}
