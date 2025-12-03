import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  form: any;
  constructor(
    private fb: FormBuilder,
    private api: ApiService
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
      alert("Rellena todos los campos correctamente");
      return;
    }

    const payload = {
      company_name: this.form.value.company_name!,
      cif: this.form.value.cif!,
      tax_address: this.form.value.tax_address!,
      email: this.form.value.email!,
      telephone: this.form.value.telephone!,
      password: this.form.value.password!,
    };

    this.api.registerProvider(payload).subscribe({
      next: (res) => {
        console.log("Proveedor registrado:", res);
        alert("Solicitud enviada correctamente");
      },
      error: (err) => {
        console.error(err);
        alert("Error al registrar proveedor");
      }
    });
  }
}
