import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  provider: any = {};
  loading: boolean = true;

  constructor(private apiService: ApiService) {
    this.fetchProviderData();
  }
  fetchProviderData() {
    this.apiService.getProviders().subscribe({
      next: (data) => {
        this.provider = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error fetching provider data:', error);
        this.loading = false;
      }
    });
  }
}
