import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TextToSpeechService } from '../../services/text-to-speech.service';

interface ChatMessage {
    sender: 'user' | 'bot';
    text?: string;
    rich?: any;
}

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chatbot.html',
    styleUrls: ['./chatbot.css']
})

export class Chatbot implements OnInit, AfterViewChecked {
    chatVisible: boolean = false;
    isDesktop: boolean = false;
    inMontajeMode: boolean = false;
    messages: ChatMessage[] = [];
    newMessage: string = '';
    isMobile: boolean = false;
    sessionId: string = '';
    private shouldScroll = false;
    
    // Propiedades para TTS
    ttsEnabled: boolean = true;
    ttsVolume: number = 0.8;
    isPlaying: boolean = false;
    
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    @Output() abrirModalIncidencia = new EventEmitter<void>();

    constructor(
        private route: ActivatedRoute, 
        private api: ApiService,
        private tts: TextToSpeechService
    ) { }


    abrirIncidencia() {
        this.abrirModalIncidencia.emit();
    }

    scrollToBottom(): void {
        if (this.messagesContainer) {
            setTimeout(() => {
                const container = this.messagesContainer.nativeElement;
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            });
        }
    }

    ngOnInit() {
        this.checkScreenSize();
        const furnitureRef = this.route.snapshot.paramMap.get('ref');
        let saved = sessionStorage.getItem('chatbot_session');

        if (!saved) {
            saved = Math.random().toString(36).substring(2) + Date.now();
            sessionStorage.setItem('chatbot_session', saved);
        }

        this.sessionId = saved;

        console.log("SESSION ID:", this.sessionId);
        
        // Cargar configuración de TTS
        this.loadTTSSettings();
        
        if (furnitureRef) {
            this.inMontajeMode = true;
            const welcomeMessage = `¡Hola! Has iniciado el montaje del mueble ${furnitureRef}. Si necesitas ayuda, no dudes en preguntar.`;
            this.messages.push({
                sender: 'bot',
                text: welcomeMessage
            });
            // Leer mensaje de bienvenida en voz alta
            this.speakMessage(welcomeMessage);
        } else if (!this.inMontajeMode) {
            const welcomeMessage = `¡Hola! Soy Allen, el asistente virtual de Skäply. ¿En qué puedo ayudarte hoy?`;
            this.messages.push({
                sender: 'bot',
                text: welcomeMessage
            });
            // Leer mensaje de bienvenida en voz alta
            this.speakMessage(welcomeMessage);
        }

        if (this.inMontajeMode && this.isDesktop) {
            this.chatVisible = true;
        }
    }
    ngAfterViewChecked() {
    if (this.shouldScroll) {
        this.scrollToBottom();
        this.shouldScroll = false;
    }
}
    toggleChat() {
        if (!this.inMontajeMode || !this.isDesktop) {
            this.chatVisible = !this.chatVisible;
        }
    }

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.checkScreenSize();
    }

    checkScreenSize() {
        this.isDesktop = window.innerWidth >= 1024;
        this.isMobile = !this.isDesktop;
        if (this.inMontajeMode && this.isDesktop) {
            this.chatVisible = true;
        }
    }

    sendMessage() {
        if (!this.newMessage.trim()) return;

        this.messages.push({ sender: 'user', text: this.newMessage });
        this.scrollToBottom();
        const messageToSend = this.newMessage;
        this.newMessage = '';

        this.api.enviarMensajeChatbot(messageToSend)
            .subscribe(data => {
                const messages = data.fulfillmentMessages || [];
                let handled = false;

                for (let m of messages) {
                    if (m.message === "text" && m.text?.text?.[0]) {
                        const botMessage = m.text.text[0];
                        this.messages.push({ sender: 'bot', text: botMessage });
                        // Leer respuesta del bot en voz alta
                        this.speakMessage(botMessage);
                        handled = true;
                    }

                    if (m.card) {
                        this.messages.push({
                            sender: 'bot',
                            rich: {
                                type: 'card',
                                title: m.card.title,
                                subtitle: m.card.subtitle || '',
                                imageUri: m.card.imageUri || '',
                                buttons: m.card.buttons || []
                            }
                        });
                        handled = true;
                    }
                    const rich = m.payload?.fields?.richContent?.listValue?.values;
                    if (rich) {
                        this.renderRichContent(rich);
                        handled = true;
                    }
                    const payload = m.payload;
                    if (payload?.fields?.redirect) {
                        console.log("Redirect detectado:", payload.fields.redirect);

                        setTimeout(() => {
                            if (payload.fields.redirect.stringValue === "registro") {
                                window.location.href = "/registro";
                                
                                
                            }
                        }, 2000); 
                        handled = true;
                    }
                }

                if (!handled) {
                    const fallbackMessage = 'No entiendo esa consulta.';
                    this.messages.push({ sender: 'bot', text: fallbackMessage });
                    this.speakMessage(fallbackMessage);
                }
                 this.shouldScroll = true;
            });
    }

    renderRichContent(groups: any[]) {
        groups.forEach(group => {
            const list = group.listValue?.values || [];
            list.forEach((item: any) => {
                const fields = item.structValue?.fields;
                if (!fields) return;

                const parsed: any = {};
                Object.keys(fields).forEach(key => {
                    const field = fields[key];
                    if (field.stringValue !== undefined) parsed[key] = field.stringValue;
                    if (field.listValue?.values) {
                        parsed[key] = field.listValue.values.map((v: any) => {
                            if (v.structValue?.fields) {
                                const obj: any = {};
                                Object.keys(v.structValue.fields).forEach(k => {
                                    const subv = v.structValue.fields[k];
                                    if (subv.stringValue !== undefined) obj[k] = subv.stringValue;
                                });
                                return obj;
                            }
                            return v.stringValue;
                        });
                    }
                });

                this.messages.push({ sender: 'bot', rich: parsed });
            });
        });
    }

    handleChipClick(text: string) {
        this.newMessage = text;
        this.sendMessage();
    }

    openLink(url: string) {
        window.open(url, '_blank');
    }

    // Métodos para Text-to-Speech
    
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
     * Reproduce un mensaje usando text-to-speech
     */
    async speakMessage(text: string) {
        if (!this.ttsEnabled || !text) return;
        
        try {
            this.isPlaying = true;
            await this.tts.speak(text);
        } catch (error) {
            console.error('Error al reproducir mensaje:', error);
        } finally {
            this.isPlaying = false;
        }
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
            .filter(m => m.sender === 'bot' && m.text)
            .pop();
        
        if (lastBotMessage && lastBotMessage.text) {
            this.speakMessage(lastBotMessage.text);
        }
    }
}
