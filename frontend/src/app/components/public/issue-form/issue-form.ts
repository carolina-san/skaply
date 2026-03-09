import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ApiService } from '../../../services/api.service';
import { Modal } from '../../UI/modal/modal';

@Component({
    selector: 'app-issue-form',
    standalone: true,
    imports: [CommonModule, FormsModule, Modal],
    templateUrl: './issue-form.html'
})
export class IssueForm implements OnChanges {

    @Input() furnitureId: string = '';
    @Output() close = new EventEmitter<void>();
    @ViewChild('incidenciaForm') incidenceForm!: NgForm;

    isOpen = signal(false);
    isSubmitting = signal(false);
    submitStatus = signal<'idle' | 'success' | 'error'>('idle');
    submitMessage = signal('');

    referenceError = signal('');
    currentRef = '';

    constructor(private apiService: ApiService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['furnitureId']) {
            this.currentRef = this.furnitureId || '';
        }
    }

    // Abrir modal
    open() {
        this.isOpen.set(true);
        this.referenceError.set('');
        this.submitStatus.set('idle');
        this.submitMessage.set('');
    }

    // Cerrar modal
    closeModal() {
        this.isOpen.set(false);
        this.close.emit();
    }

    clearModal() {
        this.incidenceForm?.resetForm();
        this.referenceError.set('');
        this.submitStatus.set('idle');
        this.submitMessage.set('');
        this.closeModal();
    }

    checkReference(ref: string | null | undefined) {
        if (!ref || !ref.trim()) {
            this.referenceError.set('');
            return;
        }

        this.apiService.getFurnitureById(ref).subscribe({
            next: (response) => {
                let furniture = null;
                if (response?.data) {
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        furniture = response.data[0];
                    } else if (!Array.isArray(response.data)) {
                        furniture = response.data;
                    }
                }

                if (!furniture?.id) {
                    this.referenceError.set('Mueble no encontrado');
                } else {
                    this.referenceError.set('');
                }
            },
            error: () => {
                this.referenceError.set('Esa referencia no existe');
            }
        });
    }

    enviarIncidencia(form: NgForm) {

        if (form.invalid) {
            Object.values(form.controls).forEach(control => {
                control.markAsTouched();
            });
            return;
        }

        this.isSubmitting.set(true);
        this.submitStatus.set('idle');
        this.submitMessage.set('');

        const reference = form.value.reference?.trim();
        const descripcion = form.value.descripcion?.trim();
        const email = form.value.email?.trim() || 'skaply.lynk@gmail.com';

        this.apiService.getFurnitureById(reference).subscribe({
            next: (response) => {

                let furniture = null;

                if (response?.data) {
                    if (Array.isArray(response.data) && response.data.length > 0) {
                        furniture = response.data[0];
                    } else if (!Array.isArray(response.data)) {
                        furniture = response.data;
                    }
                }

                if (!furniture?.id) {
                    this.isSubmitting.set(false);
                    this.submitStatus.set('error');
                    this.submitMessage.set('No se encontró el mueble. Verifica la referencia.');
                    return;
                }

                const issue = {
                    description: descripcion,
                    date: new Date().toISOString(),
                    user_email: email
                };

                this.apiService.postIssue(furniture.id, issue).subscribe({
                    next: (res) => {
                        console.log('Incidencia enviada:', res);

                        this.submitStatus.set('success');
                        this.submitMessage.set('Incidencia enviada correctamente.');
                        this.isSubmitting.set(false);

                        // Opcional: Cerrar automáticamente después de un tiempo
                        setTimeout(() => {
                            if (this.isOpen()) {
                                form.resetForm();
                                this.currentRef = this.furnitureId || '';
                                this.closeModal();
                            }
                        }, 2000);
                    },
                    error: (err) => {
                        console.error('Error al enviar incidencia:', err);
                        this.submitStatus.set('error');
                        this.submitMessage.set('Error al reportar la incidencia. Inténtalo de nuevo.');
                        this.isSubmitting.set(false);
                    }
                });
            },
            error: (err) => {
                console.error('Error al buscar mueble:', err);
                this.submitStatus.set('error');
                this.submitMessage.set('No se encontró el mueble. Verifica la referencia.');
                this.isSubmitting.set(false);
            }
        });
    }
}
