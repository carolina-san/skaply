import { Component, ViewChild, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chatbot } from '../../components/chatbot/chatbot';
// import { FurnitureViewer } from '../../components/furniture-viewer/furniture-viewer';
import { Modal } from '../../components/modal/modal';
import { GraphicsEngineComponent } from '../../components/graphicsEngine/graphicsEngine.component';
import { ApiService } from '../../services/api.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-viewer-3d',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Chatbot, GraphicsEngineComponent, Modal],
  templateUrl: './viewer-3d.html'
})
export class Viewer3D implements OnInit {
  @ViewChild(GraphicsEngineComponent) graphicsEngine!: GraphicsEngineComponent;

  // Review Modal State
  isReviewModalOpen = signal(false);
  reviewStars = signal(0);
  reviewText = signal('');
  isSubmittingReview = signal(false);

  vistaActiva: string = 'mueble';
  modelPath: string = '/assets/models/EKET_70332124_35x25x35.glb';
  furnitureId: string = '';
  furnitureName: string = '';
  furnitureLoading: boolean = false;
  descripcionIncidencia: string = '';
  emailIncidencia: string = '';
  isIncidenciaModalOpen = false;
  isARActive = signal(false);

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private seo: SeoService
  ) { }

  ngOnInit() {
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

  enviarIncidencia() {
    if (!this.descripcionIncidencia || !this.descripcionIncidencia.trim()) {
      alert('Por favor, describe la incidencia');
      return;
    }

    if (!this.furnitureId) {
      console.error('furnitureId está vacío o undefined');
      alert('No se pudo identificar el mueble. Por favor recarga la página.');
      return;
    }

    //intentamos obtener el mueble por ID o referencia
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

        if (!furniture || !furniture.id) {
          alert('No se encontró el mueble con esa referencia');
          return;
        }

        //enviamos la incidencia con el ID numérico del mueble
        const issue = {
          description: this.descripcionIncidencia.trim(),
          date: new Date().toISOString(),
          user_email: this.emailIncidencia.trim() || 'anonimo@lynk.com'
        };

        this.apiService.postIssue(furniture.id, issue).subscribe({
          next: (response) => {
            console.log('Incidencia enviada:', response);
            alert('Incidencia reportada correctamente. Te contactaremos al email proporcionado.');
            this.resetIncidenciaForm();
          },
          error: (err) => {
            console.error('Error al enviar incidencia:', err);
            alert('Error al reportar la incidencia. Inténtalo de nuevo.');
          }
        });
      },
      error: (err) => {
        console.error('Error al buscar mueble:', err);
        alert('No se encontró el mueble. Verifica la referencia.');
      }
    });
  }

  abrirModalIncidencia() {
    if (!this.furnitureId) {
      console.warn('Advertencia: furnitureId está vacío al abrir modal');
    }
    this.isIncidenciaModalOpen = true;
  }

  resetIncidenciaForm() {
    this.descripcionIncidencia = '';
    this.emailIncidencia = '';
    this.isIncidenciaModalOpen = false;
  }

  isDescripcionValida(): boolean {
    return !!(this.descripcionIncidencia && this.descripcionIncidencia.trim().length > 0);
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
  }

  closeReviewModal(): void {
    this.isReviewModalOpen.set(false);
    this.reviewStars.set(0);
    this.reviewText.set('');
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

    this.apiService.postReview(furnitureId, stars, text || undefined).subscribe({
      next: (response) => {
        this.isSubmittingReview.set(false);
        this.closeReviewModal();
        alert('¡Gracias por tu reseña!');
      },
      error: (error) => {
        console.error('Error al guardar la review:', error);
        this.isSubmittingReview.set(false);
        const errorMessage = error.error?.message || error.message || 'Error desconocido';
        alert('Error al guardar la reseña: ' + errorMessage);
      }
    });
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