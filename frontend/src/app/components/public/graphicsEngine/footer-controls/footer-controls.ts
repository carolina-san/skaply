import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoiceCommandInfo } from '../../../../services/graphicsEngine/voice-control.service';

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
  lastCommand = input<VoiceCommandInfo | null>(null);
  mode = input<'manual' | 'simulation' | 'final'>('manual');
  manualStep = input<number>(0);
  totalSteps = input<number>(0);
  isSimulationPaused = input<boolean>(false);
  simulationSpeed = input<number>(1);
  isVoiceListening = input<boolean>(false);
  isVoiceSupported = input<boolean>(false);
  isVoiceSoundActive = input<boolean>(false);
  micFlowState = input<'idle' | 'requesting' | 'denied'>('idle');
  isWhiteBg = input<boolean>(false);
  isLoading = input<boolean>(false);


  // Outputs
  modeChange = output<'manual' | 'simulation' | 'final'>();
  goToStepAction = output<number>();
  prevStepAction = output<void>();
  nextStepAction = output<void>();
  togglePauseAction = output<void>();
  speedChange = output<number>();
  finishAction = output<void>();
  toggleVoiceAction = output<void>();
  proceedMicPermission = output<void>();
  cancelMicPermission = output<void>();
  closeMicDenied = output<void>();
  retryMicPermission = output<void>();
  toggleBgColorAction = output<void>();

  readonly simulationSpeeds = [0.5, 1, 1.5, 2];

  get isManualFirstStep(): boolean {
    return this.manualStep() === 0;
  }
}
