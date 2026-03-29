import { Injectable, signal } from '@angular/core';
import annyang, { isSpeechRecognitionSupported } from 'annyang';

/** Información del comando detectado para mostrarlo en la UI */
export interface VoiceCommandInfo {
  /** Texto legible de la acción detectada */
  label: string;
  /** Icono SVG path de Material Symbols para acompañar el texto */
  icon: 'next' | 'prev' | 'goto' | 'final' | 'restart' | 'error';
}

@Injectable()
export class VoiceControlService {
  isListening = signal(false);
  isSupported = signal(false);
  isSoundActive = signal(false);
  /** Flujo del diálogo de permiso de micrófono, igual que arFlowState en AR */
  micFlowState = signal<'idle' | 'requesting' | 'denied'>('idle');
  /** Orden que acaba de reconocerse; null si no hay nada que mostrar */
  lastCommand = signal<VoiceCommandInfo | null>(null);

  private onNextStep?: () => void;
  private onPrevStep?: () => void;
  private onGoToStep?: (step: number) => void;
  private onLastStep?: () => void;
  private getManualStep?: () => number;
  private getTotalManualSteps?: () => number;
  private getTotalLogicalSteps?: () => number;
  private getHasIsolatedPart?: () => boolean;
  private soundTimeout?: ReturnType<typeof setTimeout>;
  private commandTimeout?: ReturnType<typeof setTimeout>;

  /** Duración en ms que el toast es visible tras reconocer la orden */
  private readonly TOAST_MS = 2000;

  init(
    onNext: () => void,
    onPrev: () => void,
    onGoTo: (step: number) => void,
    onLast: () => void,
    getManualStep: () => number,
    getTotalManualSteps: () => number,
    getTotalLogicalSteps: () => number,
    getHasIsolatedPart: () => boolean
  ): void {
    this.onNextStep = onNext;
    this.onPrevStep = onPrev;
    this.onGoToStep = onGoTo;
    this.onLastStep = onLast;
    this.getManualStep = getManualStep;
    this.getTotalManualSteps = getTotalManualSteps;
    this.getTotalLogicalSteps = getTotalLogicalSteps;
    this.getHasIsolatedPart = getHasIsolatedPart;

    if (!isSpeechRecognitionSupported()) {
      console.warn('[VoiceControl] SpeechRecognition no está disponible en este navegador.');
      this.isSupported.set(false);
      return;
    }

    this.isSupported.set(true);

    const commands = {
      // ── Paso siguiente ───────────────────────────────────────────────
      'siguiente paso': () => this.handleNextStep(),
      'paso siguiente': () => this.handleNextStep(),
      'siguiente': () => this.handleNextStep(),
      'avanza': () => this.handleNextStep(),

      // ── Paso anterior ────────────────────────────────────────────────
      'paso anterior': () => this.handlePrevStep(),
      'anterior': () => this.handlePrevStep(),
      'paso atrás': () => this.handlePrevStep(),
      'paso atras': () => this.handlePrevStep(),
      'retrocede': () => this.handlePrevStep(),

      // ── Último paso / resultado final ────────────────────────────────
      'último paso': () => this.handleLastStep(),
      'ultimo paso': () => this.handleLastStep(),
      'resultado': () => this.handleLastStep(),
      'final': () => this.handleLastStep(),
      'ver el resultado': () => this.handleLastStep(),
      'ver resultado': () => this.handleLastStep(),
      'paso final': () => this.handleLastStep(),

      // ── Ir a paso concreto ───────────────────────────────────────────
      'ir al paso :numero': (n: string) => this.handleGoToStep(n),
      'paso :numero': (n: string) => this.handleGoToStep(n),
      'ir al paso número :numero': (n: string) => this.handleGoToStep(n),

      // ── Reiniciar ───────────────────────────────────────────────────
      'inicio': () => this.handleRestart(),
      'reiniciar': () => this.handleRestart(),
      'volver al inicio': () => this.handleRestart(),
      'volver al principio': () => this.handleRestart(),
      'empezar de nuevo': () => this.handleRestart()
    };

    annyang.addCommands(commands);
    annyang.setLanguage('es-ES');

    // Onda visual: solo cuando hay sonido real
    annyang.addCallback('soundstart', () => {
      this.isSoundActive.set(true);
      clearTimeout(this.soundTimeout);
      this.soundTimeout = setTimeout(() => this.isSoundActive.set(false), 1500);
    });
    annyang.addCallback('result', () => {
      this.isSoundActive.set(true);
      clearTimeout(this.soundTimeout);
      this.soundTimeout = setTimeout(() => this.isSoundActive.set(false), 2000);
    });
    annyang.addCallback('end', () => {
      clearTimeout(this.soundTimeout);
      this.isSoundActive.set(false);
    });
    // Si annyang detecta voz pero no hace "match" con nuestros comandos
    annyang.addCallback('resultNoMatch', () => {
      this.run({ label: 'No entendido', icon: 'error' }, () => { });
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  private checkIsolation(): boolean {
    if (this.getHasIsolatedPart?.()) {
      this.showError('Cierra la inspección primero');
      return true;
    }
    return false;
  }

  private showError(msg: string): void {
    this.run({ label: msg, icon: 'error' }, () => { });
  }

  private handleNextStep(): void {
    if (this.checkIsolation()) return;
    const current = this.getManualStep?.() ?? 0;
    const total = this.getTotalManualSteps?.() ?? 0;
    if (current < total - 1) {
      this.run({ label: 'Siguiente paso', icon: 'next' }, () => this.onNextStep?.());
    } else {
      this.showError('Este es el último paso');
    }
  }

  private handlePrevStep(): void {
    if (this.checkIsolation()) return;
    const current = this.getManualStep?.() ?? 0;
    if (current > 0) {
      this.run({ label: 'Paso anterior', icon: 'prev' }, () => this.onPrevStep?.());
    } else {
      this.showError('Este es el primer paso');
    }
  }

  private handleLastStep(): void {
    if (this.checkIsolation()) return;
    const current = this.getManualStep?.() ?? 0;
    const total = this.getTotalManualSteps?.() ?? 0;
    if (current < total - 1) {
      this.run({ label: 'Ver resultado', icon: 'final' }, () => this.onLastStep?.());
    } else {
      this.showError('Ya estás en el final');
    }
  }

  private handleRestart(): void {
    if (this.checkIsolation()) return;
    const current = this.getManualStep?.() ?? 0;
    if (current > 0) {
      this.run({ label: 'Reiniciar', icon: 'restart' }, () => this.onGoToStep?.(0));
    } else {
      this.showError('Ya estás al inicio');
    }
  }

  /**
   * Muestra el toast con la info del comando y luego ejecuta el callback.
   * El toast desaparece automáticamente tras TOAST_MS milisegundos.
   */
  private run(info: VoiceCommandInfo, action: () => void): void {
    clearTimeout(this.commandTimeout);
    this.lastCommand.set(info);
    action();
    this.commandTimeout = setTimeout(() => this.lastCommand.set(null), this.TOAST_MS);
  }

  private handleGoToStep(raw: string): void {
    if (this.checkIsolation()) return;
    const n = this.parseSpanishNumber(raw.trim().toLowerCase());
    const totalLogical = this.getTotalLogicalSteps?.() ?? 0;
    if (n !== null && n >= 1 && n <= totalLogical) {
      this.run(
        { label: `Ir al paso ${n}`, icon: 'goto' },
        () => this.onGoToStep?.(n - 1)
      );
    } else {
      console.warn(`[VoiceControl] Paso inválido o fuera de rango: "${raw}" (Límite lógico: ${totalLogical})`);
      this.showError('Ese paso no existe');
    }
  }

  private parseSpanishNumber(word: string): number | null {
    const direct = parseInt(word, 10);
    if (!isNaN(direct)) return direct;

    const map: Record<string, number> = {
      'cero': 0, 'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4,
      'cinco': 5, 'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
      'once': 11, 'doce': 12, 'trece': 13, 'catorce': 14, 'quince': 15,
      'dieciséis': 16, 'dieciseis': 16, 'diecisiete': 17, 'dieciocho': 18,
      'diecinueve': 19, 'veinte': 20, 'veintiuno': 21, 'veintidós': 22,
      'veintidos': 22, 'veintitrés': 23, 'veintitres': 23, 'veinticuatro': 24,
      'veinticinco': 25, 'veintiséis': 26, 'veintiseis': 26,
      'veintisiete': 27, 'veintiocho': 28, 'veintinueve': 29, 'treinta': 30,
    };
    return map[word] ?? null;
  }

  // ── Ciclo de vida ─────────────────────────────────────────────────────

  toggle(): void {
    if (this.isListening()) {
      this.stop();
    } else {
      // Abre el diálogo de permiso primero, igual que hace el AR con la cámara
      this.micFlowState.set('requesting');
    }
  }

  /** El usuario ha pulsado "Permitir" en el diálogo: pedimos acceso real al micro */
  async proceedWithMicPermission(): Promise<void> {
    // Si el navegador no soporta getUserMedia (algunos móviles), iniciamos annyang
    // directamente: él mismo gestiona el permiso vía SpeechRecognition internamente.
    if (!navigator.mediaDevices?.getUserMedia) {
      console.info('[VoiceControl] getUserMedia no disponible, iniciando annyang directamente.');
      this.micFlowState.set('idle');
      this.start();
      return;
    }

    try {
      // En escritorio: getUserMedia dispara la notificación nativa del navegador.
      // Esto es necesario cuando Permissions-Policy bloquea SpeechRecognition directamente.
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Una vez concedido el permiso, liberamos el stream; annyang usará la misma API internamente
      stream.getTracks().forEach(t => t.stop());
      this.micFlowState.set('idle');
      this.start();
    } catch (err) {
      const error = err as DOMException;
      console.error('[VoiceControl] Error al solicitar micrófono:', error?.name, error?.message, err);

      if (error?.name === 'NotAllowedError' || error?.name === 'NotFoundError') {
        // El usuario denegó explícitamente o no hay micrófono
        this.micFlowState.set('denied');
      } else if (error?.name === 'SecurityError') {
        // HTTP sin HTTPS
        this.micFlowState.set('denied');
        console.warn('[VoiceControl] La página debe servirse por HTTPS.');
      } else {
        // Error inesperado: intentar arrancar annyang igualmente
        console.warn('[VoiceControl] getUserMedia falló inesperadamente, intentando annyang directamente:', error?.name);
        this.micFlowState.set('idle');
        this.start();
      }
    }
  }

  cancelMicPermission(): void {
    this.micFlowState.set('idle');
  }

  closeMicDenied(): void {
    this.micFlowState.set('idle');
  }

  retryMicPermission(): void {
    this.micFlowState.set('requesting');
  }

  private start(): void {
    if (!this.isSupported()) return;
    // continuous: false lanza el resultado en cuanto detecta una pausa natural → respuesta más rápida
    annyang.start({ autoRestart: true, continuous: false });
    this.isListening.set(true);
  }

  stop(): void {
    if (!this.isSupported()) return;
    annyang.abort();
    clearTimeout(this.soundTimeout);
    clearTimeout(this.commandTimeout);
    this.isListening.set(false);
    this.isSoundActive.set(false);
    this.lastCommand.set(null);
  }

  dispose(): void {
    if (!this.isSupported()) return;
    annyang.abort();
    annyang.removeCommands();
    annyang.removeCallback();
    clearTimeout(this.soundTimeout);
    clearTimeout(this.commandTimeout);
    this.isListening.set(false);
    this.isSoundActive.set(false);
    this.lastCommand.set(null);
  }
}
