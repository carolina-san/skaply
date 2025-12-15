import { Component, ViewChild, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Chatbot } from '../../components/chatbot/chatbot';
import { FurnitureViewer } from '../../components/furniture-viewer/furniture-viewer';
import { MenuViewer } from '../../components/menu-viewer/menu-viewer';
import { Modal } from '../../components/modal/modal';
import { GraphicsEngineComponent } from '../../components/graphicsEngine/graphicsEngine.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-viewer-3d',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, Chatbot, GraphicsEngineComponent, MenuViewer, Modal],
  templateUrl: './viewer-3d.html',
  styleUrls: ['./viewer-3d.css']
})
export class Viewer3D implements OnInit {
  @ViewChild(FurnitureViewer) furnitureViewer!: FurnitureViewer;

  vistaActiva: string = 'mueble';
  modelPath: string = '/assets/models/EKET_70332124_35x25x35.glb';
  furnitureId: string = '';
  descripcionIncidencia: string = '';
  emailIncidencia: string = '';
  isIncidenciaModalOpen = false;

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      console.log('📋 Todos los parámetros de la ruta:', params);
      if (params['ref']) {
        this.furnitureId = params['ref'];
        console.log('🔍 Furniture ID capturado de la ruta:', this.furnitureId, 'Tipo:', typeof this.furnitureId);
      } else {
        console.warn('⚠️ No se encontró el parámetro "ref" en la ruta');
        console.log('Parámetros disponibles:', Object.keys(params));
      }
    });
  }

  enviarIncidencia() {
    console.log('🚀 Iniciando envío de incidencia. FurnitureId actual:', this.furnitureId);

    if (!this.descripcionIncidencia || !this.descripcionIncidencia.trim()) {
      alert('Por favor, describe la incidencia');
      return;
    }

    if (!this.furnitureId) {
      console.error('❌ furnitureId está vacío o undefined');
      alert('No se pudo identificar el mueble. Por favor recarga la página.');
      return;
    }

    console.log('🔍 Buscando mueble con referencia:', this.furnitureId);

    // Primero intentamos obtener el mueble por ID o referencia
    this.apiService.getFurnitureById(this.furnitureId).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de la API:', response);

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

        console.log('📦 Mueble encontrado con ID:', furniture.id);

        // Ahora enviamos la incidencia con el ID numérico del mueble
        const issue = {
          description: this.descripcionIncidencia.trim(),
          date: new Date().toISOString(),
          user_email: this.emailIncidencia.trim() || 'anonimo@lynk.com'
        };

        console.log('📤 Enviando incidencia:', issue);

        this.apiService.postIssue(furniture.id, issue).subscribe({
          next: (response) => {
            console.log('✅ Incidencia enviada:', response);
            alert('Incidencia reportada correctamente. Te contactaremos al email proporcionado.');
            this.resetIncidenciaForm();
          },
          error: (err) => {
            console.error('❌ Error al enviar incidencia:', err);
            alert('Error al reportar la incidencia. Inténtalo de nuevo.');
          }
        });
      },
      error: (err) => {
        console.error('❌ Error al buscar mueble:', err);
        alert('No se encontró el mueble. Verifica la referencia.');
      }
    });
  }

  abrirModalIncidencia() {
    console.log('🔓 Abriendo modal de incidencia. FurnitureId actual:', this.furnitureId);
    if (!this.furnitureId) {
      console.warn('⚠️ Advertencia: furnitureId está vacío al abrir modal');
    }
    this.isIncidenciaModalOpen = true;
  }

  resetIncidenciaForm() {
    this.descripcionIncidencia = '';
    this.emailIncidencia = '';
    this.isIncidenciaModalOpen = false;
  }

  // Array de modelos disponibles
  private modelPaths = [
    '/assets/models/EKET_70332124_35x25x35.glb',
    // Agrega más rutas aquí
  ];
  private currentModelIndex = 0;

  cambiarVista(vista: string): void {
    this.vistaActiva = vista;
    console.log('Vista cambiada a:', vista);
  }

  // Métodos para controlar el visor 3D
  resetCamera(): void {
    this.furnitureViewer?.resetCamera();
  }

  toggleWireframe(): void {
    this.furnitureViewer?.toggleWireframe();
  }

  toggleAutoRotate(): void {
    this.furnitureViewer?.toggleAutoRotate();
  }

  loadNextModel(): void {
    this.currentModelIndex = (this.currentModelIndex + 1) % this.modelPaths.length;
    this.modelPath = this.modelPaths[this.currentModelIndex];
    this.furnitureViewer?.loadModel(this.modelPath);
  }
}