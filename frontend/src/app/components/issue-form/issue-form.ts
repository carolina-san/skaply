import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Modal } from '../modal/modal';

@Component({
    selector: 'app-issue-form',
    standalone: true,
    imports: [CommonModule, FormsModule, Modal],
    templateUrl: './issue-form.html'
})
export class IssueForm {
    @Input() furnitureId: string = '';
    @Output() close = new EventEmitter<void>();

    isOpen = signal(false);
    descripcionIncidencia = signal('');
    emailIncidencia = signal('');
    isSubmitting = signal(false);

    furnitureReference = signal('');

    constructor(private apiService: ApiService) { }

    open() {
        this.isOpen.set(true);
        if (this.furnitureId) {
            this.furnitureReference.set(this.furnitureId);
        }
    }

    closeModal() {
        this.isOpen.set(false);
        this.close.emit();
    }

    resetForm() {
        this.descripcionIncidencia.set('');
        this.emailIncidencia.set('');
        // No reseteamos furnitureReference si viene por input, pero si es manual quizás sí?
        // Mejor mantener la logica de open(): si hay input, se pone.
        if (!this.furnitureId) {
            this.furnitureReference.set('');
        }
        this.isSubmitting.set(false);
    }

    isDescripcionValida(): boolean {
        return !!(this.descripcionIncidencia() && this.descripcionIncidencia().trim().length > 0 && this.furnitureReference() && this.furnitureReference().trim().length > 0);
    }

    enviarIncidencia() {
        if (!this.isDescripcionValida()) {
            alert('Por favor, completa todos los campos requeridos');
            return;
        }

        const ref = this.furnitureReference();
        if (!ref) {
            alert('Por favor indica la referencia del mueble.');
            return;
        }

        this.isSubmitting.set(true);

        // Intentamos obtener el mueble por ID o referencia para asegurar que existe y obtener su ID numérico si es necesario
        this.apiService.getFurnitureById(ref).subscribe({
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
                    this.isSubmitting.set(false);
                    return;
                }

                const issue = {
                    description: this.descripcionIncidencia().trim(),
                    date: new Date().toISOString(),
                    user_email: this.emailIncidencia().trim() || 'anonimo@lynk.com'
                };

                this.apiService.postIssue(furniture.id, issue).subscribe({
                    next: (response) => {
                        console.log('Incidencia enviada:', response);
                        alert('Incidencia reportada correctamente. Te contactaremos al email proporcionado.');
                        this.resetForm();
                        this.closeModal();
                    },
                    error: (err) => {
                        console.error('Error al enviar incidencia:', err);
                        alert('Error al reportar la incidencia. Inténtalo de nuevo.');
                        this.isSubmitting.set(false);
                    }
                });
            },
            error: (err) => {
                console.error('Error al buscar mueble:', err);
                alert('No se encontró el mueble. Verifica la referencia.');
                this.isSubmitting.set(false);
            }
        });
    }
}
