import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // para *ngIf
import { FilterOptions, ProviderBasic, Color } from '../../types';

@Component({
  selector: 'app-filter-panel',
  imports: [CommonModule],
  templateUrl: './filter-panel.html',
})

export class FilterPanelComponent {
  @Input() isOpen = false;
  @Input() providers: ProviderBasic[] = [];
  @Input() colors: Color[] = [];
  // la dificultad no sé si se deberia de coger de la BD.

  @Output() close = new EventEmitter<void>();
  @Output() applyFilter = new EventEmitter<FilterOptions>();

  isAnimating = false;
  openSection: 'provider' | 'color' | 'difficulty' | null = null;

  selectedFilters: FilterOptions = {
    difficulties: [],
    provider_ids: [],
    category_ids: [],
    color_ids: []
  };

  availableColors = [ // se deberán coger de la bd
    { value: 'Beige', label: 'Beige', hex: '#F5E6D3' },
    { value: 'Verde', label: 'Verde', hex: '#4CAF50' },
    { value: 'Azul', label: 'Azul', hex: '#2196F3' },
    { value: 'Gris', label: 'Gris', hex: '#9E9E9E' },
    { value: 'Marrón', label: 'Marrón', hex: '#795548' },
    { value: 'Negro', label: 'Negro', hex: '#212121' }
  ];

  availableDifficulties = [ // se deberán coger de la bd
    { value: 'low' as const, label: 'Baja', icon: 'sentiment_satisfied', color: '#4CAF50' },
    { value: 'medium' as const, label: 'Media', icon: 'sentiment_neutral', color: '#FF9800' },
    { value: 'high' as const, label: 'Alta', icon: 'sentiment_dissatisfied', color: '#F44336' }
  ];

  ngOnChanges() {
    console.log("ha cambiado ng");
    if (this.isOpen) {
      setTimeout(() => this.isAnimating = true, 10);
    } else {
      this.isAnimating = false;
    }
  }

  toggleSection(section: 'provider' | 'color' | 'difficulty') {
    this.openSection = this.openSection === section ? null : section;
  }

  toggleProvider(id: number) {
    const index = this.selectedFilters.provider_ids.indexOf(id);
    if (index > -1) {
      this.selectedFilters.provider_ids.splice(index, 1);
    } else {
      this.selectedFilters.provider_ids.push(id);
    }
  }

  toggleColor(id: number) {
    const index = this.selectedFilters.color_ids.indexOf(id);
    if (index > -1) {
      this.selectedFilters.color_ids.splice(index, 1);
    } else {
      this.selectedFilters.color_ids.push(id);
    }
  }

  toggleDifficulty(difficulty: 'low' | 'medium' | 'high') {
    const index = this.selectedFilters.difficulties.indexOf(difficulty);
    if (index > -1) {
      this.selectedFilters.difficulties.splice(index, 1);
    } else {
      this.selectedFilters.difficulties.push(difficulty);
    }
  }

  clearFilters() {
    this.selectedFilters = {
      difficulties: [],
      provider_ids: [],
      category_ids: [],
      color_ids: []
    };
  }

  applyFilters() {
    this.applyFilter.emit(this.selectedFilters);
    this.closeModal();
  }

  closeModal() {
    this.isAnimating = false;
    setTimeout(() => this.close.emit(), 300);
  }
}