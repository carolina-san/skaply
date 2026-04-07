import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { Difficulty } from '../../../types';

@Component({
  selector: 'app-upload-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './upload-form.html',
  styleUrl: './upload-form.css'
})
export class UploadForm implements OnInit {
  @Output() furnitureCreated = new EventEmitter<void>();

  furnitureForm!: FormGroup;
  categories: any[] = [];
  colors: any[] = [];
  difficulties = Object.values(Difficulty);
  glbFile: File | null = null;
  pdfFile: File | null = null;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';
  private messageTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly messageDurationMs = 3500;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.loadColors();
    console.log('Upload form initialized');
  }

  private initializeForm(): void {
    this.furnitureForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      short_description: ['', [Validators.required]],
      category_id: ['', Validators.required],
      color_id: ['', Validators.required],
      difficulty: ['', Validators.required],
      required_people: [1, [Validators.required, Validators.min(1)]],
      reference_number: ['', Validators.required],
      image_url: ['']
    });
  }

  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response: any) => {
        this.categories = Array.isArray(response.data) ? response.data : response;
      },
      error: (err) => {
        console.error('Error loading categories:', err);
        this.showErrorMessage('Error al cargar las categorías');
      }
    });
  }

  private loadColors(): void {
    this.apiService.getColors().subscribe({
      next: (response: any) => {
        this.colors = Array.isArray(response.data) ? response.data : response;
        console.log('Colores cargados:', this.colors);
      },
      error: (err) => {
        console.error('Error loading colors:', err);
        this.showErrorMessage('Error al cargar los colores');
      }
    });
  }

  onGlbFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.glb')) {
      this.glbFile = file;
      this.dismissErrorMessage();
    } else {
      this.showErrorMessage('Por favor selecciona un archivo .glb válido');
      this.glbFile = null;
    }
  }

  onPdfFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.name.endsWith('.pdf')) {
      this.pdfFile = file;
      this.dismissErrorMessage();
    } else {
      this.showErrorMessage('Por favor selecciona un archivo .pdf válido');
      this.pdfFile = null;
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.furnitureForm.valid || !this.glbFile || !this.pdfFile) {
      this.showErrorMessage('Por favor completa todos los campos requeridos y selecciona ambos archivos');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const user = this.authService.getCurrentUser();
      if (!user) {
        this.showErrorMessage('Usuario no autenticado');
        this.isSubmitting = false;
        return;
      }

      // Aquí deberías cargar los archivos a un servicio de almacenamiento
      // y obtener las URIs. Por ahora, usando placeholder URIs.
      const formData = {
        ...this.furnitureForm.value,
        file_uri: await this.uploadFile(this.glbFile),
        assemblyPDF_uri: await this.uploadFile(this.pdfFile),
        provider_id: user.id,
        visible: true
      };

      this.apiService.createFurniture(formData).subscribe({
        next: (response) => {
          this.showSuccessMessage('Mueble creado correctamente');
          this.furnitureForm.reset();
          this.glbFile = null;
          this.pdfFile = null;
          this.isSubmitting = false;

          // Reset file inputs
          const glbInput = document.getElementById('glb-file') as HTMLInputElement;
          const pdfInput = document.getElementById('pdf-file') as HTMLInputElement;
          if (glbInput) glbInput.value = '';
          if (pdfInput) pdfInput.value = '';

          setTimeout(() => {
            this.furnitureCreated.emit();
          }, 1200);
        },
        error: (err) => {
          this.showErrorMessage(err.error?.message || 'Error al crear el mueble');
          this.isSubmitting = false;
        }
      });
    } catch (error: any) {
      this.showErrorMessage('Error al procesar los archivos');
      this.isSubmitting = false;
    }
  }

  private uploadFile(file: File): Promise<string> {
    // Placeholder para subida de archivo
    // Aquí implementar la lógica real de subida a un servicio de almacenamiento
    // Por ahora retorna una URI temporal
    return Promise.resolve(`/storage/${file.name}`);
  }

  clearMessages(): void {
    this.clearMessageTimer();
    this.successMessage = '';
    this.errorMessage = '';
  }

  private showErrorMessage(message: string): void {
    this.successMessage = '';
    this.errorMessage = message;
    this.scheduleMessageClear();
  }

  private showSuccessMessage(message: string): void {
    this.errorMessage = '';
    this.successMessage = message;
    this.scheduleMessageClear();
  }

  private dismissErrorMessage(): void {
    if (!this.errorMessage) {
      return;
    }

    this.errorMessage = '';
    if (!this.successMessage) {
      this.clearMessageTimer();
    }
  }

  private scheduleMessageClear(): void {
    this.clearMessageTimer();
    this.messageTimeoutId = setTimeout(() => {
      this.clearMessages();
    }, this.messageDurationMs);
  }

  private clearMessageTimer(): void {
    if (!this.messageTimeoutId) {
      return;
    }

    clearTimeout(this.messageTimeoutId);
    this.messageTimeoutId = null;
  }
}
