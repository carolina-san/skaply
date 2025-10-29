import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
    selector: 'app-chatbot',
    standalone: true, 
    imports: [CommonModule],
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
    ngOnInit() {
        this.initialHeight = window.innerHeight * 0.9;
        this.chatHeight = this.initialHeight;
    }
    toggleChat() {
        this.chatVisible = !this.chatVisible;
        this.chatHeight = this.initialHeight;
    }
    startDrag(event: MouseEvent) {
        if (this.chatVisible) {
            this.isDragging = true;
            event.preventDefault();

            this.startDragHeight = this.chatHeight;
            this.startY = event.clientY;
        }
    }

    @HostListener('document:mouseup')
    stopDrag() {
        if (this.isDragging) {
            this.isDragging = false;

            if (this.chatHeight < (this.initialHeight * 0.7)) {
                this.chatVisible = false;
            }
            this.chatHeight = this.initialHeight;
        }
    }

    @HostListener('document:mousemove', ['$event'])
    onDrag(event: MouseEvent) {
        if (!this.isDragging || !this.chatVisible) return;

        const newHeight = this.startDragHeight - (event.clientY - this.startY);

        if (newHeight >= 200 && newHeight <= this.initialHeight) {
            this.chatHeight = newHeight;
        }
    }
}