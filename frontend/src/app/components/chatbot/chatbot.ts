import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

interface ChatMessage {
    sender: 'user' | 'bot';
    text?: string;
    rich?: any; // para RichContent
}

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './chatbot.html',
    styleUrls: ['./chatbot.css']
})
export class Chatbot implements OnInit {
    chatVisible: boolean = false;
    isDragging: boolean = false;
    chatHeight: number = 0;
    initialHeight: number = 0;
    isDesktop = false;
    messages: ChatMessage[] = [];
    newMessage: string = '';
    constructor(private route: ActivatedRoute) {
        this.checkScreenSize();
        
    }
    ngOnInit() {
        this.initialHeight = window.innerHeight * 0.9;
        this.chatHeight = this.initialHeight;
       const furnitureRef = this.route.snapshot.paramMap.get('ref');
       if (furnitureRef) {
            this.messages.push({
                sender: 'bot',
                text: `¡Hola! Has iniciado el montaje del mueble ${furnitureRef}. Si necesitas ayuda, no dudes en preguntar.`
            });
        }
    }

    toggleChat() {
        if (!this.isDesktop) {
            this.chatVisible = !this.chatVisible;
            this.chatHeight = this.initialHeight;
        }

    }
    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.checkScreenSize();
    }

    checkScreenSize() {
        this.isDesktop = window.innerWidth >= 1024; // >=lg
        if (this.isDesktop) this.chatVisible = true; // Siempre visible en escritorio
    }
    sendMessage() {
        if (!this.newMessage.trim()) return;

        this.messages.push({ sender: 'user', text: this.newMessage });

        const messageToSend = this.newMessage;
        this.newMessage = '';

        fetch('http://localhost:3000/api/chatbot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: messageToSend })
        })
            .then(res => res.json())
            .then(data => {
                console.log("RESPUESTA DEL BACKEND:", data);

                const messages = data.fulfillmentMessages || [];

                let handled = false;
                for (let m of messages) {
                    if (m.message === "text" && m.text?.text?.[0]) {
                        this.messages.push({ sender: 'bot', text: m.text.text[0] });
                        handled = true;
                        break;
                    }
                }
                for (let m of messages) {
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
                }

                for (let m of messages) {
                    const rich = m.payload?.fields?.richContent?.listValue?.values;
                    if (rich) {
                        this.renderRichContent(rich);
                        handled = true;
                        break;
                    }
                }
                if (!handled) {
                    this.messages.push({ sender: 'bot', text: 'No entiendo esa consulta.' });
                }
            });
    }

    // ----------------------------------------------
    // RENDERIZAR RICH CONTENT
    // ----------------------------------------------

    renderRichContent(groups: any[]) {
        groups.forEach(group => {
            const list = group.listValue?.values || [];

            list.forEach((item: any) => {
                const fields = item.structValue?.fields;
                if (!fields) return;

                const parsed: any = {};

                Object.keys(fields).forEach(key => {
                    const field = fields[key];

                    // Campos string
                    if (field.stringValue !== undefined) {
                        parsed[key] = field.stringValue;
                    }

                    // Campos con arrays (chips, botones, etc.)
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

                this.messages.push({
                    sender: 'bot',
                    rich: parsed
                });
            });
        });
    }


    // ----------------------------------------------
    // MANEJO DE CLICS EN CHIPS
    // ----------------------------------------------

    handleChipClick(text: string) {
        this.newMessage = text;
        this.sendMessage();
    }

    openLink(url: string) {
        window.open(url, '_blank');
    }
}
