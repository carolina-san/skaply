import { Component, ViewChild, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chatbot } from '../../components/chatbot/chatbot';
// import { FurnitureViewer } from '../../components/furniture-viewer/furniture-viewer';
import { Modal } from '../../components/modal/modal';
import { IssueForm } from '../../components/issue-form/issue-form';
import { GraphicsEngineComponent } from '../../components/graphicsEngine/graphicsEngine.component';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-viewer-3d',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Chatbot, GraphicsEngineComponent, Modal, IssueForm],
  templateUrl: './viewer-3d.html'
})
export class Viewer3D implements OnInit {
  @ViewChild(GraphicsEngineComponent) graphicsEngine!: GraphicsEngineComponent;
  @ViewChild(IssueForm) issueForm!: IssueForm;

  // Review Modal State
  isReviewModalOpen = signal(false);
  reviewStars = signal(0);
  reviewText = signal('');
  isSubmittingReview = signal(false);
  submitStatus = signal<'idle' | 'success' | 'error'>('idle');
  submitMessage = signal('');

  vistaActiva: string = 'mueble';
  modelPath: string = '/assets/models/EKET_70332124_35x25x35.glb';
  furnitureId: string = '';
  furnitureName: string = '';
  furnitureLoading: boolean = false;
  isARActive = signal(false);
  currentRoute: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private seo: SeoService
  ) { }

  ngOnInit() {
    this.currentRoute = this.router.url;
    this.seo.setSeo({
      title: `Visualizador 3D de Muebles - Skäply`,
      description: `Visualiza muebles en 3D, pruébalos en realidad aumentada y reporta problemas directamente desde Skäply.`,
      canonical: `https://skaply.ovh/viewer-3d`,
      index: true
    });

    this.route.params.subscribe(params => {
      if (params['ref']) {
        this.furnitureId = params['ref'];
        this.loadFurnitureName();
      } else {
        console.warn('No se encontró el parámetro "ref" en la ruta');
        console.log('Parámetros disponibles:', Object.keys(params));
      }
    });
  }

  loadFurnitureName() {
    if (!this.furnitureId) return;
    this.furnitureLoading = true;

    this.apiService.getFurnitureById(this.furnitureId).subscribe({
      next: (response) => {
        let furniture = null;
        if (response && response.data) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            furniture = response.data[0];
          } else if (!Array.isArray(response.data)) {
            furniture = response.data;
          }
        }

        if (furniture && furniture.name) {
          this.furnitureName = furniture.name;
        } else {
          this.furnitureName = 'Mueble';
          console.warn('No se encontró el nombre del mueble');
        }

        this.seo.setSeo({
          title: `Montaje 3D de ${this.furnitureName} - Skäply`,
          description: `Visualiza ${this.furnitureName} en 3D, pruébalo en realidad aumentada y reporta problemas directamente desde Skäply.`,
          canonical: `https://skaply.ovh/viewer-3d/${this.furnitureId}`,
          index: true,
          schema: {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            'name': `Cómo montar ${this.furnitureName}`,
            'description': `Guía interactiva para montar ${this.furnitureName} con visualización 3D`,
            'url': `https://skaply.ovh/viewer-3d/${this.furnitureId}`,
            'step': [
              {
                '@type': 'HowToStep',
                'name': 'Visualizar en 3D',
                'text': `Explora ${this.furnitureName} en nuestro motor 3D interactivo`
              },
              {
                '@type': 'HowToStep',
                'name': 'Prueba en Realidad Aumentada',
                'text': 'Visualiza cómo lucirá el mueble en tu espacio con AR'
              },
              {
                '@type': 'HowToStep',
                'name': 'Reportar Problemas',
                'text': 'Notifica cualquier problema o sugerencia sobre el mueble'
              }
            ]
          }
        });

        this.furnitureLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar información del mueble:', err);
        this.furnitureName = 'Mueble desconocido';

        this.seo.setSeo({
          title: `Montaje 3D - Skäply`,
          description: `Visualiza muebles en 3D, pruébalos en realidad aumentada y reporta problemas directamente desde Skäply.`,
          canonical: `https://skaply.ovh/viewer-3d`,
          index: true
        });

        this.furnitureLoading = false;
      }
    });
  }




  abrirModalIncidencia() {
    if (!this.furnitureId) {
      console.warn('Advertencia: furnitureId está vacío al abrir modal');
    }
    this.issueForm.open();
  }

  finMontaje() {
    if (this.currentRoute.includes('viewer-3d')) {
      this.apiService.resetAssembly().subscribe({
        next: (res) => {
          console.log("Montaje finalizado:", res);
        },
        error: (err) => {
          console.error("Error finalizando montaje:", err);
        }
      });
    }
  }

  // Array de modelos disponibles
  private modelPaths = [
    '/assets/models/EKET_70332124_35x25x35.glb',
  ];
  private currentModelIndex = 0;

  cambiarVista(vista: string): void {
    this.vistaActiva = vista;
  }

  // Métodos para controlar el visor 3D
  // Métodos para controlar el visor 3D
  resetCamera(): void {
    this.graphicsEngine?.resetCameraPosition();
  }

  // Review Modal Methods
  openReviewModal(): void {
    this.isReviewModalOpen.set(true);
    this.reviewStars.set(0);
    this.reviewText.set('');
    this.submitStatus.set('idle');
    this.submitMessage.set('');
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.reviewStars.set(0);
    this.reviewText.set('');
    this.submitStatus.set('idle');
    this.submitMessage.set('');
  }

  setRating(stars: number): void {
    this.reviewStars.set(stars);
  }

  submitReview(): void {
    // Obtener y convertir el furniture ID
    let furnitureId = 1; // ID por defecto
    const inputId = this.furnitureId;

    if (inputId) {
      const parsedId = typeof inputId === 'string' ? parseInt(inputId, 10) : inputId;
      if (!isNaN(parsedId) && parsedId > 0) {
        furnitureId = parsedId;
      }
    }

    const stars = this.reviewStars();
    const text = this.reviewText().trim();

    if (stars === 0) {
      return;
    }

    this.isSubmittingReview.set(true);
    this.submitStatus.set('idle');
    this.submitMessage.set('');

    this.apiService.postReview(furnitureId, stars, text || undefined).subscribe({
      next: (response) => {
        this.submitStatus.set('success');
        this.submitMessage.set('¡Gracias por tu reseña!');
        this.isSubmittingReview.set(false);

        // Retrasar el cierre para que se vea el mensaje
        setTimeout(() => {
          this.closeReviewModal();
          this.finMontaje();
          this.router.navigate(['/catalogo']);
        }, 1500);
      },
      error: (error) => {
        console.error('Error al guardar la review:', error);
        this.isSubmittingReview.set(false);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        this.submitStatus.set('error');
        this.submitMessage.set('Error al guardar la reseña: ' + errorMessage);
      }
    });
  }

  skipReview(): void {
    this.closeReviewModal();
    this.finMontaje();
    this.router.navigate(['/catalogo']);
  }

  toggleWireframe(): void {
    // this.furnitureViewer?.toggleWireframe();
  }

  toggleAutoRotate(): void {
    // this.furnitureViewer?.toggleAutoRotate();
  }

  loadNextModel(): void {
    this.currentModelIndex = (this.currentModelIndex + 1) % this.modelPaths.length;
    this.modelPath = this.modelPaths[this.currentModelIndex];
    // this.furnitureViewer?.loadModel(this.modelPath);
  }
}