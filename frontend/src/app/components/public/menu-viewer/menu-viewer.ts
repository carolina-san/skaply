import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu-viewer.html',
  styleUrl: './menu-viewer.css'
})
export class MenuViewer {
  opcionActiva: string = 'mueble';

  seleccionarOpcion(opcion: string) {
    this.opcionActiva = opcion;
    console.log('Opción seleccionada:', opcion); // Para verificar que funciona
  }
}