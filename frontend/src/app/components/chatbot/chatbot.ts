import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { TextToSpeechService } from '../../services/text-to-speech.service';
import { FilterSharingService } from '../../services/filter-sharing.service';
import { VoiceControls } from '../voice-controls/voice-controls';

interface ChatMessage {
    sender: 'user' | 'bot';
    text?: string;
    rich?: any;
}

@Component({
    selector: 'app-chatbot',
    standalone: true,
    imports: [CommonModule, FormsModule, VoiceControls],
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
    private welcomeEventSent: boolean = false;
    isCatalogPage = false;

    isPlaying: boolean = false;

    @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
    @ViewChild('messageInput') private messageInput!: ElementRef<HTMLInputElement>;
    @Output() abrirModalIncidencia = new EventEmitter<void>();

    constructor(
        private route: ActivatedRoute,
        private api: ApiService,
        private tts: TextToSpeechService,
        private router: Router,
        private filterSharingService: FilterSharingService
    ) {
        this.isCatalogPage = this.router.url.split('?')[0].includes('catalogo');
    }


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

        if (furnitureRef) {
            this.inMontajeMode = true;
            this.autoInitAssembly(furnitureRef);
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

            // Enviar welcome event la primera vez que se abre el chatbot (solo si no estamos en montaje)
            if (this.chatVisible && !this.welcomeEventSent && !this.inMontajeMode) {
                this.sendWelcomeEvent();
                this.welcomeEventSent = true;
            }

            // Hacer focus en el input cuando se abre el chatbot
            if (this.chatVisible) {
                setTimeout(() => {
                    this.messageInput?.nativeElement?.focus();
                }, 100);
            }
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

        this.api.sendChatbotMessage(messageToSend)
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
                        if (m.payload?.fields?.message?.stringValue) {
                            this.speakMessage(m.payload.fields.message.stringValue);
                        }
                        handled = true;
                    }
                    const payload = m.payload;
                    console.log(payload);
                    if (payload?.fields?.redirect) {
                        console.log("Hay redirect", payload.fields.redirect);
                        setTimeout(() => {
                            if (payload.fields.redirect.stringValue === "register") {
                                window.location.href = "/register";


                            }
                            if (payload.fields.redirect.stringValue === "issue.form") {
                                console.log("Ha entrado");
                                this.abrirIncidencia();

                            }
                        }, 2000);
                        handled = true;
                    }
                    else if (payload?.fields?.action?.stringValue === "filter.by.category") {
                        const category = payload.fields.category?.stringValue;

                        if (category) {
                            this.api.getCategoryByName(category).subscribe({
                                next: (categoryResponse) => {
                                    const categoryData = categoryResponse.data || [];

                                    if (categoryData) {
                                        this.filterSharingService.clearSelectedCategory();
                                        this.filterSharingService.clearSelectedColors();
                                        this.filterSharingService.setSelectedCategory(categoryData.id);
                                        this.router.navigate(['/catalogo']);
                                    }
                                },
                                error: (error) => {
                                    console.error('Error HTTP al obtener categoría:', error);
                                }
                            });
                            handled = true;
                        }
                    }
                    else if (payload?.fields?.action?.stringValue === "filter.by.color") {
                        const color = payload.fields.color?.stringValue;
                        if (color) {
                            this.api.getColorByName(color).subscribe({
                                next: (colorResponse) => {
                                    const colorData = colorResponse.data || [];
                                    if (colorData) {
                                        this.filterSharingService.clearSelectedCategory();
                                        this.filterSharingService.clearSelectedColors();
                                        this.filterSharingService.setSelectedColor(colorData.id);
                                        this.router.navigate(['/catalogo']);
                                    }
                                },
                                error: (error) => { console.error('Error:', error); }
                            });
                            handled = true;
                        }
                    }
                }

                if (!handled) {
                    const fallbackMessage = 'No puedo procesar esa consulta. Prueba otra vez';
                    this.messages.push({ sender: 'bot', text: fallbackMessage });
                    this.speakMessage(fallbackMessage);
                }
                this.shouldScroll = true;
                this.messageInput?.nativeElement?.focus();

            });
    }

    renderRichContent(groups: any[]) {

        const isDirectFormat = groups.length > 0 &&
            (groups[0].type !== undefined ||
                groups[0].title !== undefined);

        if (isDirectFormat) {
            this.processDirectRichContent(groups);
            return;
        }

        groups.forEach(group => {
            const list = group.listValue?.values || [];
            const items: any[] = [];
            let chips: any = null;
            let richContentText = ''; // Para acumular el texto a leer

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

                // Separar chips del resto de items
                if (parsed.type === 'chips') {
                    chips = parsed;
                } else {
                    items.push(parsed);
                    // Extraer texto de cada item para leer
                    if (parsed.title) richContentText += parsed.title + '. ';
                    if (parsed.subtitle) richContentText += parsed.subtitle + '. ';
                    if (parsed.description) richContentText += parsed.description + '. ';
                }
            });

            // Mensaje con items (info, list, description)
            if (items.length > 0) {
                this.messages.push({ sender: 'bot', rich: { items } });
            }

            // Mensaje separado para chips
            if (chips) {
                this.messages.push({ sender: 'bot', rich: chips });
            }

            // Leer todo el contenido del rich content
            if (richContentText.trim()) {
                this.speakMessage(richContentText.trim());
            }
        });
    }

    processDirectRichContent(items: any[]) {
        const processedItems: any[] = [];
        let chips: any = null;
        let richContentText = ''; // Para acumular el texto a leer

        items.forEach((item: any) => {
            // Hacer copia para no modificar el original
            const parsed: any = { ...item };

            // Procesar el campo 'items' si existe (para listas anidadas)
            if (parsed.items && Array.isArray(parsed.items)) {
                parsed.items = parsed.items.map((subitem: any) => ({ ...subitem }));
            }

            // Separar chips del resto de items
            if (parsed.type === 'chips') {
                chips = parsed;
            } else {
                processedItems.push(parsed);
                // Extraer texto de cada item para leer
                if (parsed.title) richContentText += parsed.title + '. ';
                if (parsed.subtitle) richContentText += parsed.subtitle + '. ';
                if (parsed.description) richContentText += parsed.description + '. ';
                if (parsed.text) richContentText += parsed.text + '. ';
            }
        });

        // Mensaje con items (info, list, description)
        if (processedItems.length > 0) {
            this.messages.push({ sender: 'bot', rich: { items: processedItems } });
        }

        // Mensaje separado para chips
        if (chips) {
            this.messages.push({ sender: 'bot', rich: chips });
        }

        // Leer todo el contenido del rich content
        if (richContentText.trim()) {
            this.speakMessage(richContentText.trim());
        }
    }

    handleChipClick(text: string) {
        // Enviar el mensaje siempre
        this.newMessage = text;
        this.sendMessage();

        // Obtener categorías y colores para verificar si el chip es una categoría o color
        this.api.getCategories().subscribe({
            next: (categoriesResponse) => {
                const categories = categoriesResponse.data || [];
                const selectedCategory = categories.find((c: any) => c.name === text);

                // if (selectedCategory) {
                //     // Es una categoría, navegar al catálogo con el filtro
                //     this.filterSharingService.setSelectedCategory(selectedCategory.id);
                //     this.router.navigate(['/catalogo']);
                //     return;
                // }

                this.api.getColors().subscribe({
                    next: (colorsResponse) => {
                        const colors = colorsResponse.data || [];
                        const selectedColor = colors.find((c: any) => c.name === text);

                        // if (selectedColor) {
                        //     // Es un color, navegar al catálogo con el filtro de color
                        //     this.filterSharingService.setSelectedColor(selectedColor.id);
                        //     this.router.navigate(['/catalogo']);
                        // }
                    },
                    error: (error) => {
                        // Si hay error, solo continuar (el mensaje ya fue enviado)
                        console.error('Error al obtener colores:', error);
                    }
                });
            },
            error: (error) => {
                // Si hay error, solo continuar (el mensaje ya fue enviado)
                console.error('Error al obtener categorías:', error);
            }
        });
    }

    openLink(url: string) {
        window.open(url, '_blank');
    }

    /**
     * Reproduce un mensaje usando text-to-speech
     */
    async speakMessage(text: string) {
        const settings = this.tts.getSettings();
        if (!settings.isEnabled || !text) return;

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
     * Detiene la reproducción de TTS
     */
    onStopSpeaking() {
        this.tts.stop();
        this.isPlaying = false;
    }

    /**
     * Maneja el evento de reproducción desde voice-controls
     */
    onSpeak(text: string) {
        this.speakMessage(text);
    }

    sendWelcomeEvent() {
        this.api.sendWelcomeEvent()
            .subscribe(
                data => {
                    const messages = data.fulfillmentMessages || [];
                    let handled = false;

                    for (let m of messages) {
                        if (m.message === "text" && m.text?.text?.[0]) {
                            const botMessage = m.text.text[0];
                            this.messages.push({ sender: 'bot', text: botMessage });
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
                            if (m.payload?.fields?.message?.stringValue) {
                                this.speakMessage(m.payload.fields.message.stringValue);
                            }
                            handled = true;
                        }
                    }
                    this.shouldScroll = true;
                },
                error => {
                    console.error('Error enviando welcome event:', error);
                }
            );
    }

    autoInitAssembly(furnitureRef: string) {
        this.api.initAssembly(furnitureRef)
            .subscribe({
                next: (res) => {
                    const messages = res.fulfillmentMessages || [];
                    for (let m of messages) {
                        if (m.message === "text" && m.text?.text?.[0]) {
                            const botMessage = m.text.text[0];
                            this.messages.push({ sender: 'bot', text: botMessage });
                            this.speakMessage(botMessage);
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
                        }
                        const rich = m.payload?.fields?.richContent?.listValue?.values;
                        if (rich) {
                            this.renderRichContent(rich);
                            if (m.payload?.fields?.message?.stringValue) {
                                this.speakMessage(m.payload.fields.message.stringValue);
                            }
                        }
                    }
                    this.shouldScroll = true;
                },
                error: (err) => {
                    console.error("Error iniciando montaje automáticamente:", err);
                }
            });
    }
}
