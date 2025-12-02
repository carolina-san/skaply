import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.html'
})
export class Modal{
  @Input() open = false;
  @Input() title?: string;

  @Output() openChange = new EventEmitter<boolean>();

  close() {
    this.open = false;
    this.openChange.emit(false);
  }
}
