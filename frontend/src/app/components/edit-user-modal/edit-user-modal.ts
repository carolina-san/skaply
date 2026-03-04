import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Modal } from '../modal/modal';

@Component({
    selector: 'app-edit-user-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, Modal],
    templateUrl: './edit-user-modal.html'
})
export class EditUserModal implements OnChanges, OnInit {
    @Input() open: boolean = false;
    @Output() openChange = new EventEmitter<boolean>();

    @Input() user: any = null;
    @Input() role: string = 'provider';
    @Input() isSubmitting: boolean = false;
    @Input() errorMessage: string | null = null;
    @Input() successMessage: string | null = null;

    @Output() save = new EventEmitter<any>();

    uniqueId = `profileImage_${Math.random().toString(36).substring(2, 11)}`;

    editForm: FormGroup;
    hasChanges: boolean = false;
    initialFormValues: any = {};

    imagePreview: string | null = null;
    selectedImageFile: File | null = null;
    imageBase64: string | null = null;
    localErrorMessage: string | null = null;

    constructor(private fb: FormBuilder) {
        this.editForm = this.fb.group({
            name: [''],
            company_name: [''],
            email: ['', [Validators.required, Validators.email]],
            telephone: [''],
            password: ['', [Validators.minLength(12)]]
        });
    }

    ngOnInit() {
        this.editForm.valueChanges.subscribe(() => {
            this.checkForChanges();
        });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['open'] && this.open) {
            this.initializeForm();
        }
    }

    initializeForm() {
        this.initialFormValues = {
            name: this.user?.name || '',
            company_name: this.user?.company_name || '',
            email: this.user?.email || '',
            telephone: this.user?.telephone || '',
            password: ''
        };

        this.editForm.patchValue(this.initialFormValues);
        this.hasChanges = false;
        this.imagePreview = null;
        this.selectedImageFile = null;
        this.imageBase64 = null;
        this.localErrorMessage = null;
    }

    checkForChanges() {
        const currentValues = this.editForm.value;
        const nameChanged = currentValues.name?.trim() !== this.initialFormValues.name;
        const companyNameChanged = currentValues.company_name?.trim() !== this.initialFormValues.company_name;
        const emailChanged = currentValues.email !== this.initialFormValues.email;
        const telephoneChanged = currentValues.telephone?.trim() !== this.initialFormValues.telephone;
        const passwordChanged = currentValues.password?.trim() !== '';
        const imageChanged = this.imageBase64 !== null;

        this.hasChanges = nameChanged || companyNameChanged || emailChanged || telephoneChanged || passwordChanged || imageChanged;
    }

    onImageSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files[0]) {
            const file = input.files[0];

            if (file.size > 2 * 1024 * 1024) {
                this.localErrorMessage = 'La imagen es muy grande. El tamaño máximo es 2MB';
                return;
            }
            if (!file.type.startsWith('image/')) {
                this.localErrorMessage = 'Por favor selecciona un archivo de imagen válido';
                return;
            }

            this.selectedImageFile = file;
            this.localErrorMessage = null;

            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                this.imagePreview = e.target?.result as string;
                this.imageBase64 = e.target?.result as string;
                this.checkForChanges();
            };
            reader.readAsDataURL(file);
        }
    }

    removeImage(): void {
        this.imagePreview = null;
        this.selectedImageFile = null;
        this.imageBase64 = null;
        this.checkForChanges();
    }

    closeModal() {
        this.open = false;
        this.openChange.emit(false);
    }

    onSubmit() {
        if (this.editForm.invalid || !this.hasChanges) return;

        const updates: any = {};
        const formValues = this.editForm.value;

        if (this.role === 'admin' && formValues.name?.trim() !== this.initialFormValues.name) {
            if (formValues.name.trim() !== '') updates.name = formValues.name.trim();
        }
        if (this.role === 'provider' && formValues.company_name?.trim() !== this.initialFormValues.company_name) {
            if (formValues.company_name.trim() !== '') updates.company_name = formValues.company_name.trim();
        }
        if (formValues.email !== this.initialFormValues.email) {
            updates.email = formValues.email;
        }
        if (formValues.telephone?.trim() !== this.initialFormValues.telephone) {
            if (formValues.telephone.trim() !== '') updates.telephone = formValues.telephone.trim();
        }
        if (formValues.password?.trim() !== '') {
            updates.password = formValues.password;
        }
        if (this.imageBase64) {
            updates.image_url = this.imageBase64;
        }

        this.save.emit(updates);
    }
}
