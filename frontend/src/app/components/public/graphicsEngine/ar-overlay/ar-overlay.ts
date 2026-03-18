import { Component, ElementRef, ViewChild, output, input, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ARService } from '../../../../services/graphicsEngine/ar.service';

@Component({
  selector: 'app-ar-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ar-overlay.html'
})
export class ArOverlay implements OnDestroy {
  private arService = inject(ARService);

  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  // Inputs
  isSmallScreen = input<boolean>(false);
  mode = input<'manual' | 'simulation' | 'final'>('manual');

  // Outputs
  arStateChange = output<boolean>();

  get arFlowState() { return this.arService.arFlowState; }
  get isARActive() { return this.arService.isARActive; }

  ngOnDestroy(): void {
    if (this.isARActive()) {
      this.stopARInternal();
    }
  }

  toggleAR(): void {
    if (this.isARActive()) {
      this.stopARInternal();
      this.arService.arFlowState.set('idle');
    } else {
      this.arService.arFlowState.set('requesting');
    }
  }

  async proceedWithARPermission(): Promise<void> {
    try {
      const stream = await this.arService.startAR();
      this.arStateChange.emit(true);
      this.arService.arFlowState.set('idle');

      setTimeout(() => {
        if (this.videoRef?.nativeElement) {
          this.videoRef.nativeElement.srcObject = stream;
          this.videoRef.nativeElement.play();
        }
      }, 0);
    } catch (error) {
      this.arService.arFlowState.set('denied');
    }
  }

  cancelARPermissionRequest(): void {
    this.arService.arFlowState.set('idle');
  }

  retryARPermission(): void {
    this.arService.arFlowState.set('requesting');
  }

  closeARDeniedMessage(): void {
    this.arService.arFlowState.set('idle');
  }

  private stopARInternal(): void {
    if (this.videoRef?.nativeElement) {
      this.videoRef.nativeElement.srcObject = null;
    }
    this.arService.stopAR();
    this.arStateChange.emit(false);
  }
}
