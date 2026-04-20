import { Component, input, output, effect, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-graphics-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './graphics-header.html',
  styleUrls: ['./graphics-header.css']
})
export class GraphicsHeader {
  // Inputs
  engineUse = input<string>('threeJS');
  furnitureName = input<string>('');
  mode = input<'manual' | 'simulation' | 'final'>('manual');
  visibleSteps = input<number[]>([]);
  currentLogicalStep = input<number>(0);
  hasIsolatedPart = input<boolean>(false);
  isolatedPartName = input<string>('');
  isSimulating = input<boolean>(false);
  isManualComplete = input<boolean>(false);
  stepDescriptions = input<string[]>([]);
  isWhiteBg = input<boolean>(false);
  isSingleModel = input<boolean>(false);

  // Outputs
  engineChanged = output<string>();
  goToStepAction = output<number>();
  exitIsolationAction = output<void>();
  startTourAction = output<void>();

  @ViewChild('stepsContainer') private stepsContainer!: ElementRef<HTMLElement>;

  constructor() {
    effect(() => {
      const stepIndex = this.currentLogicalStep();
      setTimeout(() => this.centerActiveStep(stepIndex), 100);
    });
  }

  private centerActiveStep(activeIndex: number): void {
    if (!this.stepsContainer?.nativeElement) return;
    const container = this.stepsContainer.nativeElement;
    const buttons = container.querySelectorAll('button');

    if (buttons[activeIndex]) {
      buttons[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }
}
