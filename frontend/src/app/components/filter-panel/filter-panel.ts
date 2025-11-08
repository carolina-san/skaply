import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common'; // para *ngIf
import { FilterOptions, ProviderBasic, Color } from '../../types';
import { DifficultyOptions } from '../../utils/difficulty-labels';

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
  availableDifficulties  = DifficultyOptions;

  selectedFilters: FilterOptions = {
    difficulties: [],
    provider_ids: [],
    category_ids: [],
    color_ids: []
  };

  ngOnChanges() {
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