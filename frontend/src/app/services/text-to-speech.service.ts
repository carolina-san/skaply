import { Injectable } from '@angular/core';
import { elevenLabsConfig } from '../config/elevenlabs.config';

@Injectable({
  providedIn: 'root'
})
export class TextToSpeechService {
  private isEnabled = false;
  private volume = 0.8;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    // Cargar configuración desde localStorage
    const savedSettings = localStorage.getItem('tts-settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      this.isEnabled = settings.isEnabled ?? false;
      this.volume = settings.volume ?? 0.8;
    }
  }

  /**
   * Convierte texto a voz usando Eleven Labs o voz nativa
   */
  async speak(text: string): Promise<void> {
    if (!this.isEnabled || !text.trim()) {
      return;
    }

    // Limpiar el texto de elementos HTML si los hay
    const cleanText = this.cleanText(text);
    
    try {
      // Si hay audio reproduciéndose, lo detenemos
      this.stop();

      // Verificar si Eleven Labs está habilitado y configurado
      if (elevenLabsConfig.ENABLED && elevenLabsConfig.API_KEY && elevenLabsConfig.API_KEY !== 'tu_api_key_aqui') {
        // Llamar a la API de Eleven Labs
        const audioBlob = await this.generateSpeech(cleanText);
        
        // Crear y reproducir el audio
        const audioUrl = URL.createObjectURL(audioBlob);
        this.currentAudio = new Audio(audioUrl);
        this.currentAudio.volume = this.volume;
        
        // Limpiar URL cuando termine
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
        };

        await this.currentAudio.play();
      } else {
        // Usar la API nativa del navegador
        this.speakWithNativeAPI(cleanText);
      }
      
    } catch (error) {
      console.error('Error al generar audio con Eleven Labs:', error);
      
      // Fallback a la API nativa del navegador si falla Eleven Labs
      this.speakWithNativeAPI(cleanText);
    }
  }

  /**
   * Llama a la API de Eleven Labs para generar el audio
   */
  private async generateSpeech(text: string): Promise<Blob> {
    if (!elevenLabsConfig.API_KEY || elevenLabsConfig.API_KEY === 'tu_api_key_aqui') {
      throw new Error('API Key de Eleven Labs no configurada');
    }

    const response = await fetch(`${elevenLabsConfig.BASE_URL}/text-to-speech/${elevenLabsConfig.DEFAULT_VOICE_ID}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': elevenLabsConfig.API_KEY
      },
      body: JSON.stringify({
        text: text,
        model_id: elevenLabsConfig.MODEL_ID,
        voice_settings: elevenLabsConfig.VOICE_SETTINGS
      })
    });

    if (!response.ok) {
      throw new Error(`Error en la API: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  }

  /**
   * Fallback usando la API nativa del navegador
   */
  private speakWithNativeAPI(text: string): void {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.volume = this.volume;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      
      speechSynthesis.speak(utterance);
    }
  }

  /**
   * Detiene la reproducción actual
   */
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // También detener la síntesis nativa si está activa
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  }

  /**
   * Limpia el texto de etiquetas HTML y caracteres especiales
   */
  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remover etiquetas HTML
      .replace(/&[^;]+;/g, ' ') // Remover entidades HTML
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Configura la API key de Eleven Labs
   */
  setApiKey(apiKey: string): void {
    // En producción, esto debería manejarse de forma más segura
    // Por ejemplo, desde variables de entorno o configuración del servidor
    console.warn('Configurando API Key. En producción, maneja esto de forma segura.');
  }

  /**
   * Habilita/deshabilita el TTS
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    this.saveSettings();
    
    if (!enabled) {
      this.stop();
    }
  }

  /**
   * Configura el volumen (0.0 a 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
    
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  /**
   * Obtiene el estado actual
   */
  getSettings() {
    return {
      isEnabled: this.isEnabled,
      volume: this.volume,
      isPlaying: this.currentAudio !== null
    };
  }

  /**
   * Guarda la configuración en localStorage
   */
  private saveSettings(): void {
    const settings = {
      isEnabled: this.isEnabled,
      volume: this.volume
    };
    localStorage.setItem('tts-settings', JSON.stringify(settings));
  }

  /**
   * Verifica si el servicio está disponible
   */
  isAvailable(): boolean {
    return true; // Siempre disponible porque tenemos fallback nativo
  }

  /**
   * Verifica si Eleven Labs está habilitado y configurado
   */
  isElevenLabsEnabled(): boolean {
    return Boolean(elevenLabsConfig.ENABLED && 
                  elevenLabsConfig.API_KEY && 
                  elevenLabsConfig.API_KEY !== 'tu_api_key_aqui');
  }
}