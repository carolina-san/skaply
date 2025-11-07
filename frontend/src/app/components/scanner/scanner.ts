import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scanner.html'
})
export class Scanner implements OnDestroy {
  @Output() onScan = new EventEmitter<string>();

  isOpen = false;             // Bottom sheet abierto
  scanning = false;           // Modal de cámara activo
  showManualInput = false;    // Campo manual desplegable

  manualCode = '';
  scanResult: string | null = null;
  errorMessage: string | null = null;

  private html5QrCode: Html5Qrcode | null = null;

  ngOnDestroy() {
    this.stopScanning();
  }

  openScanner() {
    this.isOpen = true;
  }

  closeScanner() {
    this.isOpen = false;
    this.showManualInput = false;
    this.manualCode = '';
  }

  toggleManualInput() {
    this.showManualInput = !this.showManualInput;

    // si se abre el manual, cerramos cualquier estado previo
    this.scanning = false;
    this.stopScanning();
  }

  submitManualCode() {
    if (this.manualCode.trim()) {
      this.onScan.emit(this.manualCode.trim());
      this.manualCode = '';
      this.closeScanner();
    }
  }

  /*Escaner QR*/
  async startScanning() {
    this.errorMessage = null;
    this.scanResult = null;
    this.showManualInput = false;

    this.isOpen = false;

    //Mostrar modal de cámara
    this.scanning = true;

    try {
      //para que qr-reader exista en el DOM
      await this.waitForElement("#qr-reader");

      this.html5QrCode = new Html5Qrcode("qr-reader");

      await this.html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        decodedText => this.onScanSuccess(decodedText),
        () => { }
      );

    } catch (err) {
      this.errorMessage = "No se pudo acceder a la cámara.";
      console.error("Error starting scanner:", err);
      this.scanning = false;
    }
  }


  private waitForElement(selector: string): Promise<HTMLElement> {
    return new Promise(resolve => {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) return resolve(element);

      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector) as HTMLElement;
        if (el) {
          observer.disconnect();
          resolve(el);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }

  async stopScanning() {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch { }
    }
    this.scanning = false;
  }

  onScanSuccess(decodedText: string) {
    this.scanResult = decodedText;
    this.stopScanning();
    this.onScan.emit(decodedText);
  }
}
