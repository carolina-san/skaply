import { Component, ElementRef, ViewChild, output, input, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EngineService } from '../../../../services/graphicsEngine/engine.service';

@Component({
  selector: 'app-ar-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ar-overlay.html',
  styleUrl: './ar-overlay.css'
})
export class ArOverlay implements OnDestroy {
  private engineService = inject(EngineService);

  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  // Inputs
  isSmallScreen = input<boolean>(false);
  mode = input<'manual' | 'simulation' | 'final'>('manual');
  hasIsolatedPart = input<boolean>(false);

  // Outputs
  arStateChange = output<boolean>();

  // Local State
  isARActive = signal(false);
  arFlowState = signal<'idle' | 'requesting' | 'denied'>('idle');
  private videoStream: MediaStream | null = null;

  ngOnDestroy(): void {
    if (this.isARActive()) {
      this.stopARInternal();
    }
  }

  toggleAR(): void {
    if (this.isARActive()) {
      this.stopARInternal();
      this.arFlowState.set('idle');
    } else {
      this.arFlowState.set('requesting');
    }
  }

  async proceedWithARPermission(): Promise<void> {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported on this browser!');
        throw new Error('getUserMedia not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.videoStream = stream;
      this.isARActive.set(true);

      const engine = this.engineService.getEngine();
      engine.toggleControls(true, false);
      engine.setBackground(null);

      this.arStateChange.emit(true);
      this.arFlowState.set('idle');

      setTimeout(() => {
        if (this.videoRef?.nativeElement) {
          this.videoRef.nativeElement.srcObject = stream;
          this.videoRef.nativeElement.play();
        }
      }, 0);
    } catch (error) {
      console.error('Error accessing camera for AR:', error);
      this.arFlowState.set('denied');
      this.stopARInternal();
    }
  }

  cancelARPermissionRequest(): void {
    this.arFlowState.set('idle');
  }

  retryARPermission(): void {
    this.arFlowState.set('requesting');
  }

  closeARDeniedMessage(): void {
    this.arFlowState.set('idle');
  }

  private stopARInternal(): void {
    this.isARActive.set(false);
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    if (this.videoRef?.nativeElement) {
      this.videoRef.nativeElement.srcObject = null;
    }

    this.arStateChange.emit(false);
  }
}
