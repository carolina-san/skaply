import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterSharingService {
  private selectedCategorySubject = new BehaviorSubject<number | null>(null);
  selectedCategory$ = this.selectedCategorySubject.asObservable();

  private selectedColorsSubject = new BehaviorSubject<number[]>([]);
  selectedColors$ = this.selectedColorsSubject.asObservable();

  constructor() { }

  setSelectedCategory(categoryId: number | null) {
    this.selectedCategorySubject.next(categoryId);
  }

  getSelectedCategory(): number | null {
    return this.selectedCategorySubject.value;
  }

  clearSelectedCategory() {
    this.selectedCategorySubject.next(null);
  }

  setSelectedColor(colorId: number) {
    const currentColors = this.selectedColorsSubject.value;
    if (!currentColors.includes(colorId)) {
      this.selectedColorsSubject.next([...currentColors, colorId]);
    }
  }

  getSelectedColors(): number[] {
    return this.selectedColorsSubject.value;
  }

  clearSelectedColors() {
    this.selectedColorsSubject.next([]);
  }
}

