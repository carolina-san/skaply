import { Injectable, signal } from '@angular/core';
import annyang, { isSpeechRecognitionSupported } from 'annyang';

@Injectable()
export class VoiceControlService {
  isListening = signal(false);
  isSupported = signal(false);
  /** true solo durante el instante en que se detecta sonido real */
  isSoundActive = signal(false);

  private onNextStep?: () => void;
  private onPrevStep?: () => void;
  private onGoToStep?: (step: number) => void;
  private onLastStep?: () => void;
  private soundTimeout?: ReturnType<typeof setTimeout>;

  /**
   * @param onNext    Callback para "siguiente paso"
   * @param onPrev    Callback para "paso anterior"
   * @param onGoTo    Callback para "ir al paso N" — recibe el índice lógico (0-based)
   */
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
      // ── Paso anterior / paso siguiente ──────────────────────────────────────────────
      'siguiente paso': () => this.onNextStep?.(),
      'paso siguiente': () => this.onNextStep?.(),
      'siguiente': () => this.onNextStep?.(),
      'avanza': () => this.onNextStep?.(),
      'paso anterior': () => this.onPrevStep?.(),
      'anterior': () => this.onPrevStep?.(),
      'paso atrás': () => this.onPrevStep?.(),
      'paso atras': () => this.onPrevStep?.(),
      'retrocede': () => this.onPrevStep?.(),

      // ── Ir al último paso / resultado final ────────────────────────
      'último paso': () => this.onLastStep?.(),
      'ultimo paso': () => this.onLastStep?.(),
      'resultado': () => this.onLastStep?.(),
      'final': () => this.onLastStep?.(),
      'ver el resultado': () => this.onLastStep?.(),

      // ── Con parámetro :numero ─────────────────────────────────────
      // El motor de voz en español puede devolver la palabra ("tres")
      // o el dígito ("3") dependiendo del contexto.
      'ir al paso :numero': (numero: string) => this.handleGoToStep(numero),
      'paso :numero': (numero: string) => this.handleGoToStep(numero),
      'ir al paso número :numero': (numero: string) => this.handleGoToStep(numero),
    };

    annyang.addCommands(commands);
    annyang.setLanguage('es-ES');

    // Activa la onda solo cuando el motor detecta sonido real
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

  // ── Helpers ────────────────────────────────────────────────────────

  /**
   * Convierte la palabra o dígito capturado por el micrófono en un
   * número entero y llama al callback onGoToStep con índice 0-based.
   */
  private handleGoToStep(raw: string): void {
    const n = this.parseSpanishNumber(raw.trim().toLowerCase());
    if (n !== null && n >= 1) {
      this.onGoToStep?.(n - 1); // goToStep espera índice lógico 0-based
    } else {
      console.warn(`[VoiceControl] No se pudo interpretar el número: "${raw}"`);
    }
  }

  /**
   * Convierte palabras numéricas en español o cadenas dígito en número.
   * Soporta del 0 al 30, que es suficiente para pasos de montaje.
   */
  private parseSpanishNumber(word: string): number | null {
    // Si ya es un número (el motor lo devuelve como dígito)
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

  // ── Ciclo de vida ──────────────────────────────────────────────────

  toggle(): void {
    if (this.isListening()) {
      this.stop();
    } else {
      this.start();
    }
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
    this.isListening.set(false);
    this.isSoundActive.set(false);
  }

  dispose(): void {
    if (!this.isSupported()) return;
    annyang.abort();
    annyang.removeCommands();
    clearTimeout(this.soundTimeout);
    this.isListening.set(false);
    this.isSoundActive.set(false);
  }
}
