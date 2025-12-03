import { Component, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Chatbot } from '../../components/chatbot/chatbot';
import { FurnitureViewer } from '../../components/furniture-viewer/furniture-viewer';
import { MenuViewer } from '../../components/menu-viewer/menu-viewer';
import { Modal } from '../../components/modal/modal';

@Component({
  selector: 'app-viewer-3d',
  standalone: true,
  imports: [CommonModule, RouterModule, Chatbot, FurnitureViewer, MenuViewer, Modal],
  templateUrl: './viewer-3d.html',
  styleUrls: ['./viewer-3d.css']
})
export class Viewer3D implements OnInit {
  @ViewChild(FurnitureViewer) furnitureViewer!: FurnitureViewer;

  vistaActiva: string = 'mueble';
  modelPath: string = '/assets/models/EKET_70332124_35x25x35.glb';


  isIncidenciaModalOpen = false;
  constructor(private route: ActivatedRoute) {} 

  ngOnInit() {

  }

  abrirModalIncidencia() {
    this.isIncidenciaModalOpen = true;
  }

  resetIncidenciaForm() {
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