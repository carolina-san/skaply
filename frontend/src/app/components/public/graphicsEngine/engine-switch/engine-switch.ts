import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-engine-switch',
  imports: [CommonModule],
  templateUrl: './engine-switch.html',
  styleUrl: './engine-switch.css'
})
export class EngineSwitch {
  selectedEngine = input<string>('threejs');
  engineChanged = output<string>();
  isWhiteBg = input<boolean>(false);
}
