import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { EditUserModal } from '../edit-user-modal/edit-user-modal';

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [CommonModule, EditUserModal],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.css'
})
export class ProfileSidebar implements OnInit {
  currentUser: User | null = null;
  totalProviders: number = 0;
  totalFurniture: number = 0;
  isEditModalOpen: boolean = false;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private authService: AuthService,
    private apiService: ApiService
  ) {
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;

      if (this.currentUser && this.currentUser.role === 'admin') {
        this.apiService.getProviders(1, 1, '', null, null, 'approved').subscribe({
          next: (res) => {
            if (res.meta && res.meta.total !== undefined) {
              this.totalProviders = res.meta.total;
            } else {
              this.totalProviders = res.data.length;
            }
          },
          error: (err) => {
            console.error('Error fetching providers count:', err);
          }
        });
        this.apiService.getAllFurniture(1, 1).subscribe({
          next: (res) => {
            if (res.meta && res.meta.total !== undefined) {
              this.totalFurniture = res.meta.total;
            } else {
              this.totalFurniture = res.data.length;
            }
          },
          error: (err) => {
            console.error('Error fetching furniture count:', err);
          }
        });
      }
      else if (this.currentUser && this.currentUser.role === 'provider') {
        this.apiService.getAllFilteredFurniture({ provider_ids: [this.currentUser.id], page: 1, limit: 1 }).subscribe({
          next: (res) => {
            if (res.meta && res.meta.total !== undefined) {
              this.totalFurniture = res.meta.total;
            } else {
              this.totalFurniture = res.data.length;
            }
          },
          error: (err) => {
            console.error('Error fetching furniture count:', err);
          }
        });

      }

    });
  }

  openEditModal() {
    this.isEditModalOpen = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSaveProfile(updates: any) {
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.updateMyProfile(updates).subscribe({
      next: (response) => {
        this.successMessage = 'Perfil actualizado correctamente';
        this.isSubmitting = false;

        // Actualizar la sesión actual
        setTimeout(() => {
          this.authService.checkAuthStatus();
          this.isEditModalOpen = false;
        }, 1500);
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Error al actualizar el perfil';
        this.isSubmitting = false;
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
