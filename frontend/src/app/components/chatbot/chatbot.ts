import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';

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
    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    @Output() abrirModalIncidencia = new EventEmitter<void>();

    constructor(private route: ActivatedRoute, private api: ApiService) { }


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
        if (furnitureRef) {
            this.inMontajeMode = true;
            this.messages.push({
                sender: 'bot',
                text: `¡Hola! Has iniciado el montaje del mueble ${furnitureRef}. Si necesitas ayuda, no dudes en preguntar.`
            });
        } else if (!this.inMontajeMode) {
            this.messages.push({
                sender: 'bot',
                text: `¡Hola! Soy Allen, el asistente virtual de Skäply. ¿En qué puedo ayudarte hoy?`
            });
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
                        this.messages.push({ sender: 'bot', text: m.text.text[0] });
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
                    this.messages.push({ sender: 'bot', text: 'No entiendo esa consulta.' });
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
}
