import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer-controls',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer-controls.html',
  styleUrls: ['./footer-controls.css']
})
export class FooterControls {
  // Inputs
  hasIsolatedPart = input<boolean>(false);
  mode = input<'manual' | 'simulation' | 'final'>('manual');
  manualStep = input<number>(0);
  totalSteps = input<number>(0);
  isSimulationPaused = input<boolean>(false);
  simulationSpeed = input<number>(1);

  // Outputs
  modeChange = output<'manual' | 'simulation' | 'final'>();
  goToStepAction = output<number>();
  prevStepAction = output<void>();
  nextStepAction = output<void>();
  togglePauseAction = output<void>();
  speedChange = output<number>();
  finishAction = output<void>();

  readonly simulationSpeeds = [0.5, 1, 1.5, 2];

  get isManualFirstStep(): boolean {
    return this.manualStep() === 0;
  }
}
