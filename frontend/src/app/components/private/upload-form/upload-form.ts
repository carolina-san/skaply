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

  /** Modelo 3D (.glb, .obj, .3ds, …) */
  glbFile: File | null = null;
  /** PDF de montaje */
  pdfFile: File | null = null;
  /** Foto del mueble */
  imageFile: File | null = null;

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  private messageTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly messageDurationMs = 3500;

  // Extensiones aceptadas
  readonly ACCEPTED_3D   = '.glb,.obj,.fbx,.3ds,.stl,.dae,.gltf,.ply';
  readonly ACCEPTED_IMG  = '.jpg,.jpeg,.png,.webp,.gif,.avif';
  readonly ACCEPTED_PDF  = '.pdf';

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
  }

  private initializeForm(): void {
    this.furnitureForm = this.fb.group({
      name:             ['', [Validators.required, Validators.maxLength(50)]],
      short_description:['', [Validators.required]],
      category_id:      ['', Validators.required],
      color_id:         ['', Validators.required],
      difficulty:       ['', Validators.required],
      required_people:  [1, [Validators.required, Validators.min(1)]],
      reference_number: ['', Validators.required],
    });
  }

  private loadCategories(): void {
    this.apiService.getCategories().subscribe({
      next: (response: any) => {
        this.categories = Array.isArray(response.data) ? response.data : response;
      },
      error: () => this.showErrorMessage('Error al cargar las categorías')
    });
  }

  private loadColors(): void {
    this.apiService.getColors().subscribe({
      next: (response: any) => {
        this.colors = Array.isArray(response.data) ? response.data : response;
      },
      error: () => this.showErrorMessage('Error al cargar los colores')
    });
  }

  // ─── Handlers de selección de archivo ────────────────────────────────────

  on3dFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const valid = ['glb','obj','fbx','3ds','stl','dae','gltf','ply'].includes(ext);
    if (valid) {
      this.glbFile = file;
      this.dismissErrorMessage();
    } else {
      this.showErrorMessage('Formato 3D no válido. Usa .glb, .obj, .fbx, .3ds…');
      this.glbFile = null;
    }
  }

  onPdfFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.pdf')) {
      this.pdfFile = file;
      this.dismissErrorMessage();
    } else {
      this.showErrorMessage('Por favor selecciona un archivo .pdf válido');
      this.pdfFile = null;
    }
  }

  onImageFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const valid = ['jpg','jpeg','png','webp','gif','avif'].includes(ext);
    if (valid) {
      this.imageFile = file;
      this.dismissErrorMessage();
    } else {
      this.showErrorMessage('Formato de imagen no válido. Usa .jpg, .png, .webp…');
      this.imageFile = null;
    }
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  async onSubmit(): Promise<void> {
    if (!this.furnitureForm.valid || !this.glbFile || !this.pdfFile) {
      this.furnitureForm.markAllAsTouched();
      this.showErrorMessage('Por favor completa todos los campos requeridos y selecciona los archivos obligatorios');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.showErrorMessage('Usuario no autenticado');
      this.isSubmitting = false;
      return;
    }

    // Construir FormData con campos de texto + archivos
    const fd = new FormData();
    const formVal = this.furnitureForm.value;

    fd.append('name',              formVal.name);
    fd.append('short_description', formVal.short_description);
    fd.append('category_id',       String(formVal.category_id));
    fd.append('color_id',          String(formVal.color_id));
    fd.append('difficulty',        formVal.difficulty);
    fd.append('required_people',   String(formVal.required_people));
    fd.append('reference_number',  formVal.reference_number);
    fd.append('provider_id',       String(user.id));
    fd.append('visible',           'false');

    // Archivos
    fd.append('file_3d',      this.glbFile);            // → /storage/modelos_3d/
    fd.append('assembly_pdf', this.pdfFile);             // → /storage/pdfs/
    if (this.imageFile) {
      fd.append('image_uri',  this.imageFile);           // → /storage/fotos/
    }

    this.apiService.createFurniture(fd).subscribe({
      next: () => {
        this.showSuccessMessage('¡Mueble creado correctamente!');
        this.resetForm();
        setTimeout(() => this.furnitureCreated.emit(), 1200);
      },
      error: (err) => {
        this.showErrorMessage(err.error?.message || 'Error al crear el mueble');
        this.isSubmitting = false;
      }
    });
  }

  private resetForm(): void {
    this.furnitureForm.reset({ required_people: 1 });
    this.glbFile   = null;
    this.pdfFile   = null;
    this.imageFile = null;
    this.isSubmitting = false;

    (['3d-file', 'pdf-file', 'image-file'] as const).forEach(id => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = '';
    });
  }

  // ─── Mensajes ─────────────────────────────────────────────────────────────

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
    if (!this.errorMessage) return;
    this.errorMessage = '';
    if (!this.successMessage) this.clearMessageTimer();
  }

  private scheduleMessageClear(): void {
    this.clearMessageTimer();
    this.messageTimeoutId = setTimeout(() => this.clearMessages(), this.messageDurationMs);
  }

  private clearMessageTimer(): void {
    if (!this.messageTimeoutId) return;
    clearTimeout(this.messageTimeoutId);
    this.messageTimeoutId = null;
  }
}
