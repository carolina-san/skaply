import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-engine-switch',
  imports: [CommonModule],
  templateUrl: './engine-switch.html',
  styleUrl: './engine-switch.css'
})
export class EngineSwitch {
  @Input() selectedEngine: string = 'threejs';
  @Output() engineChanged = new EventEmitter<string>();
}
