import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common'; // Si es Standalone

@Component({
  selector: 'app-chatbot',
  standalone: true, // Si usas Standalone
  imports: [CommonModule],
  templateUrl: './chatbot.html',
  styleUrls: ['./chatbot.css']
})// chatbot.component.ts


export class Chatbot {
    chatVisible: boolean = false;
    isDragging: boolean = false;
    
    chatHeight: number = 750;        
    initialHeight: number = 750;      
    startDragHeight: number = 0;     
    startY: number = 0;         

    toggleChat() {
      this.chatVisible = !this.chatVisible;
      this.chatHeight = this.initialHeight; 
    }
    
    // --- Lógica de Arrastre (Drag) ---

    // 1. Iniciar el arrastre
    startDrag(event: MouseEvent) {
        if (this.chatVisible) {
          this.isDragging = true;
          event.preventDefault(); 
          
          this.startDragHeight = this.chatHeight;
          this.startY = event.clientY;
        }
    }

    // 2. Detener el arrastre
    @HostListener('document:mouseup')
    stopDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            
            // Umbral de cierre (70% de la altura máxima)
            if (this.chatHeight < (this.initialHeight * 0.7)) { 
                this.chatVisible = false;
            } 
            
            // Resetea la altura para la próxima apertura (o si no se cerró)
            this.chatHeight = this.initialHeight; 
        }
    }

    // 3. Mover
    @HostListener('document:mousemove', ['$event'])
    onDrag(event: MouseEvent) {
        if (!this.isDragging || !this.chatVisible) return;

        // Cálculo: Altura de inicio - Distancia de arrastre
        const newHeight = this.startDragHeight - (event.clientY - this.startY);
        
        // Limita la altura entre un mínimo (200px) y el máximo (initialHeight)
        if (newHeight >= 200 && newHeight <= this.initialHeight) {
            this.chatHeight = newHeight; 
        }
    }
}