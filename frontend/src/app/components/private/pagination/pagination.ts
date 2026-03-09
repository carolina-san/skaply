import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.html'
})
export class Pagination implements OnChanges {
  @Input() currentPage: number = 1;
  @Input() totalItems: number = 0;
  @Input() itemsPerPage: number = 8;

  @Output() pageChange = new EventEmitter<number>();

  totalPages: number = 1;
  startItem: number = 0;
  endItem: number = 0;
  pageNumbers: number[] = [];

  ngOnChanges(changes: SimpleChanges) {
    if (changes['totalItems'] || changes['itemsPerPage'] || changes['currentPage']) {
      this.calculatePagination();
    }
  }

  calculatePagination() {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;

    // Bounds check
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    } else if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    this.startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

    if (this.totalItems === 0) {
      this.startItem = 0;
      this.endItem = 0;
    }

    // Generate page numbers (max 5 around current)
    this.pageNumbers = [];
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + 4);

    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.pageNumbers.push(i);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
}
