import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  form: FormGroup;
  loading: boolean = false;
  error: string = '';
  success: string = '';

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      company_name: ['', Validators.required],
      cif: ['', Validators.required],
      tax_address: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
    })
  }

  submit() {
    if (this.form.invalid) {
      this.error = 'Por favor, completa todos los campos correctamente';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload = {
      email: this.form.value.email,
      password: this.form.value.password,
      company_name: this.form.value.company_name,
      cif: this.form.value.cif,
      tax_address: this.form.value.tax_address,
      telephone: this.form.value.telephone
    };

    this.api.register(payload).subscribe({
      next: (response) => {
        this.loading = false;
        this.success = 'Registro exitoso. Redirigiendo al login...';
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading = false;
        console.error('Registration error:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 409) {
          this.error = 'Ya existe una cuenta con este email';
        } else if (error.status === 400) {
          this.error = 'Datos inv\u00e1lidos. Verifica los campos';
        } else {
          this.error = 'Error al registrar la cuenta. Int\u00e9ntalo de nuevo';
        }
      }
    });
  }

  onGoogleRegister(): void {
    this.api.loginWithGoogle();
  }
}
