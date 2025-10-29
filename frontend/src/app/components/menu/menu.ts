import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-menu',
  standalone: true, 
  imports: [CommonModule],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
 @Input() menuAbierto: boolean = false;
    @Output() cerrarMenu = new EventEmitter<void>();
    @Output() abrirMenu = new EventEmitter<void>(); 

    abrir() {
        this.abrirMenu.emit();
    }
    
    cerrar() {
        this.cerrarMenu.emit();
    }
}
