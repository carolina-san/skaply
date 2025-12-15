import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GraphicsEngineComponent } from '../../components/graphicsEngine/graphicsEngine.component';
import { Chatbot } from '../../components/chatbot/chatbot';

@Component({
  selector: 'app-motor',
  imports: [CommonModule, GraphicsEngineComponent, Chatbot],
  templateUrl: './motor.html',
  styleUrls: ['./motor.css']
})
export class Motor {
  mobileChatbotVisible = false;
  desktopChatbotVisible = true; // Always visible on desktop

  constructor(private router: Router) { }

  goBack() {
    this.router.navigate(['/']);
  }

  toggleMobileChatbot() {
    this.mobileChatbotVisible = !this.mobileChatbotVisible;
  }

  closeMobileChatbot(event?: Event) {
    if (event) {
      event.preventDefault();
    }
    this.mobileChatbotVisible = false;
  }
}