import { Component, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scanner.html',
  styleUrls: ['./scanner.css']
})
export class Scanner implements OnInit, OnDestroy, OnChanges {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<boolean>();
  @Output() onScanSuccess = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  private html5QrCode: Html5Qrcode | null = null;
  private isScanning = false;
  scanError = '';
  scannedResult = '';

  ngOnInit(): void {
    // Initialization
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue && !this.isScanning) {
      setTimeout(() => this.startScanning(), 300);
    } else if (changes['isOpen'] && !changes['isOpen'].currentValue && this.isScanning) {
      this.stopScanning();
    }
  }

  ngOnDestroy(): void {
    this.stopScanning();
  }

  async startScanning(): Promise<void> {
    try {
      this.scanError = '';
      this.html5QrCode = new Html5Qrcode('qr-reader');
      
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          this.onScanSuccessHandler(decodedText);
        },
        (errorMessage) => {
          // Ignorar errores de escaneo continuo
        }
      );
      
      this.isScanning = true;
    } catch (err: any) {
      this.scanError = 'Error al acceder a la cámara. Por favor, permite el acceso a la cámara.';
      console.error('Error starting QR scanner:', err);
    }
  }

  async stopScanning(): Promise<void> {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
        this.isScanning = false;
      } catch (err) {
        console.error('Error stopping QR scanner:', err);
      }
    }
  }

  onScanSuccessHandler(decodedText: string): void {
    this.scannedResult = decodedText;
    this.onScanSuccess.emit(decodedText);
    this.closeScanner();
  }

  closeScanner(): void {
    this.stopScanning();
    this.isOpen = false;
    this.isOpenChange.emit(false);
    this.close.emit();
  }
}
