import { Injectable, signal } from '@angular/core';
import annyang, { isSpeechRecognitionSupported } from 'annyang';

/** Información del comando detectado para mostrarlo en la UI */
export interface VoiceCommandInfo {
  /** Texto legible de la acción detectada */
  label: string;
  /** Icono SVG path de Material Symbols para acompañar el texto */
  icon: 'next' | 'prev' | 'goto' | 'final';
}

@Injectable()
export class VoiceControlService {
  isListening    = signal(false);
  isSupported    = signal(false);
  isSoundActive  = signal(false);
  /** Orden que acaba de reconocerse; null si no hay nada que mostrar */
  lastCommand    = signal<VoiceCommandInfo | null>(null);

  private onNextStep?: () => void;
  private onPrevStep?: () => void;
  private onGoToStep?: (step: number) => void;
  private onLastStep?: () => void;
  private soundTimeout?:   ReturnType<typeof setTimeout>;
  private commandTimeout?: ReturnType<typeof setTimeout>;

  /** Duración en ms que el toast es visible tras reconocer la orden */
  private readonly TOAST_MS = 2000;

  init(
    onNext: () => void,
    onPrev: () => void,
    onGoTo: (step: number) => void,
    onLast: () => void
  ): void {
    this.onNextStep = onNext;
    this.onPrevStep = onPrev;
    this.onGoToStep = onGoTo;
    this.onLastStep = onLast;

    if (!isSpeechRecognitionSupported()) {
      console.warn('[VoiceControl] SpeechRecognition no está disponible en este navegador.');
      this.isSupported.set(false);
      return;
    }

    this.isSupported.set(true);

    const commands = {
      // ── Paso siguiente ───────────────────────────────────────────────
      'siguiente paso': () => this.run({ label: 'Siguiente paso', icon: 'next' }, () => this.onNextStep?.()),
      'paso siguiente': () => this.run({ label: 'Siguiente paso', icon: 'next' }, () => this.onNextStep?.()),
      'siguiente':      () => this.run({ label: 'Siguiente paso', icon: 'next' }, () => this.onNextStep?.()),
      'avanza':         () => this.run({ label: 'Siguiente paso', icon: 'next' }, () => this.onNextStep?.()),

      // ── Paso anterior ────────────────────────────────────────────────
      'paso anterior':  () => this.run({ label: 'Paso anterior',  icon: 'prev' }, () => this.onPrevStep?.()),
      'anterior':       () => this.run({ label: 'Paso anterior',  icon: 'prev' }, () => this.onPrevStep?.()),
      'paso atrás':     () => this.run({ label: 'Paso anterior',  icon: 'prev' }, () => this.onPrevStep?.()),
      'paso atras':     () => this.run({ label: 'Paso anterior',  icon: 'prev' }, () => this.onPrevStep?.()),
      'retrocede':      () => this.run({ label: 'Paso anterior',  icon: 'prev' }, () => this.onPrevStep?.()),

      // ── Último paso / resultado final ────────────────────────────────
      'último paso':      () => this.run({ label: 'Último paso',  icon: 'final' }, () => this.onLastStep?.()),
      'ultimo paso':      () => this.run({ label: 'Último paso',  icon: 'final' }, () => this.onLastStep?.()),
      'resultado':        () => this.run({ label: 'Ver resultado', icon: 'final' }, () => this.onLastStep?.()),
      'final':            () => this.run({ label: 'Ver resultado', icon: 'final' }, () => this.onLastStep?.()),
      'ver el resultado': () => this.run({ label: 'Ver resultado', icon: 'final' }, () => this.onLastStep?.()),

      // ── Ir a paso concreto ───────────────────────────────────────────
      'ir al paso :numero':         (n: string) => this.handleGoToStep(n),
      'paso :numero':               (n: string) => this.handleGoToStep(n),
      'ir al paso número :numero':  (n: string) => this.handleGoToStep(n),
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
      clearTimeout(this.soundTimeout);
      this.isSoundActive.set(false);
    });
    annyang.addCallback('end', () => {
      clearTimeout(this.soundTimeout);
      this.isSoundActive.set(false);
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────

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
    const n = this.parseSpanishNumber(raw.trim().toLowerCase());
    if (n !== null && n >= 1) {
      this.run(
        { label: `Ir al paso ${n}`, icon: 'goto' },
        () => this.onGoToStep?.(n - 1)
      );
    } else {
      console.warn(`[VoiceControl] No se pudo interpretar el número: "${raw}"`);
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
    if (this.isListening()) { this.stop(); } else { this.start(); }
  }

  start(): void {
    if (!this.isSupported()) return;
    annyang.start({ autoRestart: true, continuous: true });
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
    clearTimeout(this.soundTimeout);
    clearTimeout(this.commandTimeout);
    this.isListening.set(false);
    this.isSoundActive.set(false);
    this.lastCommand.set(null);
  }
}
