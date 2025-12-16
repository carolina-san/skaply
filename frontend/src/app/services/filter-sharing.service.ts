import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilterSharingService {
  private selectedCategorySubject = new BehaviorSubject<number | null>(null);
  selectedCategory$ = this.selectedCategorySubject.asObservable();

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
}
