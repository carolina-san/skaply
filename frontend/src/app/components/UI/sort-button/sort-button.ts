import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sort-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sort-button.html',
  styleUrl: './sort-button.css'
})
export class SortButton {
  @Input() orderBy: string = '';
  @Input() orderDir: string = '';
  @Input() column: string = '';

  @Output() sortChange = new EventEmitter<string>();

  onClick() {
    this.sortChange.emit(this.column);
  }
}
