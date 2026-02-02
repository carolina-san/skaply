import { Component } from '@angular/core';
import { ProviderPanel } from '../../components/provider-panel/provider-panel';
import { GestionMuebles } from '../../components/gestion-muebles/gestion-muebles';

@Component({
  selector: 'app-provider-profile',
  imports: [ProviderPanel, GestionMuebles],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.css'
})
export class ProviderProfile {

}
