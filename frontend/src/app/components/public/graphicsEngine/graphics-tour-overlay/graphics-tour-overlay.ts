import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-graphics-tour-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graphics-tour-overlay.html',
  styleUrls: ['./graphics-tour-overlay.css']
})
export class GraphicsTourOverlay {
  active = input<boolean>(false);
  targetRect = input<{ top: number; left: number; width: number; height: number } | null>(null);
  panelCenterX = input<number | null>(null);
  stepIndex = input<number>(0);
  stepCount = input<number>(0);
  title = input<string>('');
  description = input<string>('');

  closeAction = output<void>();
  prevAction = output<void>();
  nextAction = output<void>();
}
