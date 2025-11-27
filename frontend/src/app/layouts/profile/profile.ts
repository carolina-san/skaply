import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile {
  providers: any[] = [];

  constructor(private apiService: ApiService) {
    this.fetchProviders();
  }

  fetchProviders() {
    this.apiService.getProviders().subscribe(
      (response) => {
        console.log('Providers fetched successfully:', response);
        this.providers = response.data;
      },
      (error) => {
        console.error('Error fetching providers:', error);
      }
    );
  }
}
