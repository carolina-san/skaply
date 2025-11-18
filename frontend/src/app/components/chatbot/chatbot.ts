import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
    startDragHeight: number = 0;
    startY: number = 0;

    messages: ChatMessage[] = [];
    newMessage: string = '';

    ngOnInit() {
        this.initialHeight = window.innerHeight * 0.9;
        this.chatHeight = this.initialHeight;
    }

    toggleChat() {
        this.chatVisible = !this.chatVisible;
        this.chatHeight = this.initialHeight;
    }

    // ... tus métodos de drag ya existentes

    sendMessage() {
        if (!this.newMessage.trim()) return;

        // Agregar mensaje del usuario
        this.messages.push({ sender: 'user', text: this.newMessage });

        // Guardar mensaje antes de enviar
        const messageToSend = this.newMessage;
        this.newMessage = '';

        // Llamar al backend
        fetch('http://localhost:3000/api/chatbot/webhook', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: messageToSend })
        })
            .then(res => res.json())
            .then(data => {
                const botReply = data.fulfillmentText || 'No entiendo esa consulta.';
                this.messages.push({ sender: 'bot', text: botReply });
            })
            .catch(err => {
                console.error(err);
                this.messages.push({ sender: 'bot', text: 'Error al conectar con el chatbot.' });
            });
    }
}
