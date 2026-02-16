import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService, User } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-profile-sidebar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile-sidebar.html',
  styleUrl: './profile-sidebar.css'
})
export class ProfileSidebar implements OnInit {
  currentUser: User | null = null;
  totalProviders: number = 0;
  totalFurniture: number = 0;
  showEditModal: boolean = false;
  editForm: FormGroup;
  isSubmitting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  hasChanges: boolean = false;
  initialFormValues: any = {};

  constructor(
    private authService: AuthService, 
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: [''],
      company_name: [''],
      email: ['', [Validators.email]],
      telephone: [''],
      password: ['', [Validators.minLength(6)]]
    });
  }

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

  openEditModal() {
    if (this.currentUser) {
      this.initialFormValues = {
        name: this.currentUser.name || '',
        company_name: this.currentUser.company_name || '',
        email: this.currentUser.email || '',
        telephone: this.currentUser.telephone || '',
        password: ''
      };

      this.editForm.patchValue(this.initialFormValues);
      this.showEditModal = true;
      this.errorMessage = '';
      this.successMessage = '';
      this.hasChanges = false;

      // Detectar cambios en el formulario
      this.editForm.valueChanges.subscribe(() => {
        this.checkForChanges();
      });
    }
  }

  checkForChanges() {
    const currentValues = this.editForm.value;
    
    // Comparar si hay cambios significativos
    const nameChanged = currentValues.name?.trim() !== this.initialFormValues.name;
    const companyNameChanged = currentValues.company_name?.trim() !== this.initialFormValues.company_name;
    const emailChanged = currentValues.email !== this.initialFormValues.email;
    const telephoneChanged = currentValues.telephone?.trim() !== this.initialFormValues.telephone;
    const passwordChanged = currentValues.password?.trim() !== '';

    this.hasChanges = nameChanged || companyNameChanged || emailChanged || telephoneChanged || passwordChanged;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  onSubmit() {
    if (this.editForm.valid) {
      this.isSubmitting = true;
      this.errorMessage = '';
      this.successMessage = '';

      const updates: any = {};
      
      // Solo enviar campos que han cambiado o que tienen valor
      if (this.currentUser?.role === 'admin' && this.editForm.value.name && this.editForm.value.name.trim() !== '') {
        updates.name = this.editForm.value.name.trim();
      }

      if (this.currentUser?.role === 'provider' && this.editForm.value.company_name && this.editForm.value.company_name.trim() !== '') {
        updates.company_name = this.editForm.value.company_name.trim();
      }
      
      if (this.editForm.value.email && this.editForm.value.email !== this.currentUser?.email) {
        updates.email = this.editForm.value.email;
      }
      
      if (this.editForm.value.telephone && this.editForm.value.telephone.trim() !== '') {
        updates.telephone = this.editForm.value.telephone.trim();
      }
      
      if (this.editForm.value.password && this.editForm.value.password.trim() !== '') {
        updates.password = this.editForm.value.password;
      }

      if (Object.keys(updates).length === 0) {
        this.errorMessage = 'No hay cambios para guardar';
        this.isSubmitting = false;
        return;
      }

      this.authService.updateMyProfile(updates).subscribe({
        next: (response) => {
          this.successMessage = 'Perfil actualizado correctamente';
          this.isSubmitting = false;
          
          // Actualizar la sesión actual
          setTimeout(() => {
            this.authService.checkAuthStatus();
            this.closeEditModal();
          }, 1500);
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Error al actualizar el perfil';
          this.isSubmitting = false;
        }
      });
    } else {
      this.errorMessage = 'Por favor, corrige los errores en el formulario';
    }
  }

  logout() {
    this.authService.logout();
  }
}
