import { Injectable, signal } from '@angular/core';
import { EngineService } from './engine.service';

@Injectable()
export class ARService {
  public isARActive = signal(false);
  public arFlowState = signal<'idle' | 'requesting' | 'denied'>('idle');
  public videoStream: MediaStream | null = null;

  constructor(private engineService: EngineService) {}

  public async startAR(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('getUserMedia not supported on this browser!');
      throw new Error('getUserMedia not supported');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.videoStream = stream;

      this.isARActive.set(true);
      
      const engine = this.engineService.getEngine();
      engine.toggleControls(true, false);
      engine.setBackground(null);
      
      return stream;
    } catch (error) {
      console.error('Error accessing camera for AR:', error);
      this.stopAR();
      throw error;
    }
  }

  public stopAR(): void {
    this.isARActive.set(false);
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }
}
