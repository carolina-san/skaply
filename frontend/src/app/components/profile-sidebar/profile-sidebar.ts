import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.css'
})
export class ProfileSidebar implements OnInit {
  currentUser: User | null = null;
  totalProviders: number = 0;
  totalFurniture: number = 0;

  constructor(private authService: AuthService, private apiService: ApiService) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      if (this.currentUser && this.currentUser.role === 'admin') {
        this.apiService.getProviders().subscribe({
          next: (res) => {
            this.totalProviders = res.data.length;
          },
          error: (err) => {
            console.error('Error fetching providers count:', err);
          }
        });
        this.apiService.getAllFurniture().subscribe({
          next: (res) => {
            this.totalFurniture = res.data.length;
          },
          error: (err) => {
            console.error('Error fetching furniture count:', err);
          }
        });
      }
      else if (this.currentUser && this.currentUser.role === 'provider') {
        this.apiService.getFilteredFurniture({ provider_ids: [this.currentUser.id] }).subscribe({
          next: (res) => {
            this.totalFurniture = res.data.length;
          },
          error: (err) => {
            console.error('Error fetching furniture count:', err);
          }
        });

      }

    });


  }

  logout() {
    this.authService.logout();
  }
}
