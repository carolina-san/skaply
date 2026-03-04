import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common'; // para *ngIf
import { FilterOptions, ProviderBasic, Color } from '../../../types';
import { DifficultyOptions } from '../../../utils/difficulty-labels';


@Component({
  selector: 'app-filter-panel',
  imports: [CommonModule],
  templateUrl: './filter-panel.html'
})

export class FilterPanelComponent {
  @Input() isOpen = false;
  @Input() providers: ProviderBasic[] = [];
  @Input() colors: Color[] = [];
  @Input() activeFilters: FilterOptions = {
    difficulties: [],
    provider_ids: [],
    category_ids: [],
    color_ids: []
  };
  @Input() resetToggle: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() applyFilter = new EventEmitter<FilterOptions>();

  isAnimating = false;
  openSections: { [key: string]: boolean } = {};
  availableDifficulties = DifficultyOptions;

  selectedFilters: FilterOptions = {
    difficulties: [],
    provider_ids: [],
    category_ids: [],
    color_ids: []
  };

  ngOnChanges(changes: SimpleChanges) {
    if (changes['activeFilters'] && this.activeFilters) {
      this.selectedFilters = { ...this.activeFilters };
    }
    if (changes['resetToggle'] && this.resetToggle) {
      this.clearFilters();
    }
    if (changes['isOpen']) {
      if (this.isOpen && !changes['isOpen'].previousValue) {
        setTimeout(() => this.isAnimating = true, 10);
      } else if (!this.isOpen && changes['isOpen'].previousValue) {
        this.isAnimating = false;
      }
    }
  }

  toggleSection(section: 'provider' | 'color' | 'difficulty') {
    this.openSections[section] = !this.openSections[section];
  }

  isSectionOpen(section: 'provider' | 'color' | 'difficulty'): boolean {
    return !!this.openSections[section];
  }

  private toggleArrayItem<T>(arrayKey: keyof FilterOptions, item: T): void {
    if (!this.selectedFilters[arrayKey]) {
      this.selectedFilters = {
        ...this.selectedFilters,
        [arrayKey]: []
      };
    }
    const array = this.selectedFilters[arrayKey] as T[];
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    } else {
      array.push(item);
    }
  }

  toggleProvider(id: number) {
    this.toggleArrayItem<number>('provider_ids', id);
  }

  toggleColor(id: number) {
    this.toggleArrayItem<number>('color_ids', id);
  }

  toggleDifficulty(difficulty: 'low' | 'medium' | 'high') {
    this.toggleArrayItem<'low' | 'medium' | 'high'>('difficulties', difficulty);
  }

  clearFilters() {
    this.selectedFilters = {
      difficulties: [],
      provider_ids: [],
      category_ids: [],
      color_ids: []
    };
    this.openSections = {};
    this.applyFilter.emit(this.selectedFilters);
    this.closeModal();
  }

  applyFilters() {
    this.applyFilter.emit(this.selectedFilters);
    this.closeModal();
  }

  closeModal() {
    setTimeout(() => {
      this.isAnimating = false;
      this.close.emit();
    }, 100);
  }

  // Getters and helpers (to avoid "undefined")
  getProviderIdsLength(): number {
    return this.selectedFilters.provider_ids?.length || 0;
  }

  getColorIdsLength(): number {
    return this.selectedFilters.color_ids?.length || 0;
  }

  getDifficultiesLength(): number {
    return this.selectedFilters.difficulties?.length || 0;
  }

  isProviderSelected(id: number): boolean {
    return this.selectedFilters.provider_ids?.includes(id) || false;
  }

  isColorSelected(id: number): boolean {
    return this.selectedFilters.color_ids?.includes(id) || false;
  }

  isDifficultySelected(difficulty: 'low' | 'medium' | 'high'): boolean {
    return this.selectedFilters.difficulties?.includes(difficulty) || false;
  }
}