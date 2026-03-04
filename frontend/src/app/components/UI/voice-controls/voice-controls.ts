import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TextToSpeechService } from '../../../services/text-to-speech.service';

@Component({
  selector: 'app-voice-controls',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './voice-controls.html',
  styleUrl: './voice-controls.css'
})
export class VoiceControls implements OnInit {
  @Input() messages: any[] = [];
  @Input() isPlaying: boolean = false;
  @Output() speak = new EventEmitter<string>();
  @Output() stop = new EventEmitter<void>();

  ttsEnabled: boolean = true;
  ttsVolume: number = 0.8;

  constructor(private tts: TextToSpeechService) { }

  ngOnInit() {
    this.loadTTSSettings();
  }

  /**
   * Carga la configuración de TTS desde el servicio
   */
  loadTTSSettings() {
    const settings = this.tts.getSettings();
    this.ttsEnabled = settings.isEnabled;
    this.ttsVolume = settings.volume;
    this.isPlaying = settings.isPlaying;
  }

  /**
   * Activa/desactiva el text-to-speech
   */
  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    this.tts.setEnabled(this.ttsEnabled);

    if (!this.ttsEnabled) {
      this.stopSpeaking();
    }
  }

  /**
   * Detiene la reproducción actual
   */
  stopSpeaking() {
    this.stop.emit();
    this.tts.stop();
    this.isPlaying = false;
  }

  /**
   * Ajusta el volumen del TTS
   */
  onVolumeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.ttsVolume = parseFloat(target.value);
    this.tts.setVolume(this.ttsVolume);
  }

  /**
   * Reproduce nuevamente el último mensaje del bot
   */
  replayLastBotMessage() {
    const lastBotMessage = this.messages
      .filter((m: any) => m.sender === 'bot' && m.text)
      .pop();

    if (lastBotMessage && lastBotMessage.text) {
      this.speak.emit(lastBotMessage.text);
    }
  }
}
