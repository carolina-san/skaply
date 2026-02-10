import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GraphicsEngineComponent } from '../../components/graphicsEngine/graphicsEngine.component';
import { Chatbot } from '../../components/chatbot/chatbot';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-motor',
  standalone: true,
  imports: [CommonModule, GraphicsEngineComponent, Chatbot],
  templateUrl: './motor.html',
  styleUrls: ['./motor.css']
})
export class Motor implements OnInit {
  mobileChatbotVisible = false;
  desktopChatbotVisible = true; // Always visible on desktop

  constructor(private router: Router, private seo: SeoService) { }

  ngOnInit() {
    this.seo.setSeo({
      title: `Motor 3D Interactivo - Skäply`,
      description: `Visualiza y monta tus muebles en 3D con nuestro motor interactivo. Experimenta la realidad aumentada de Skäply.`,
      canonical: `https://skaply.ovh/motor`,
      index: true,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': 'Motor 3D de Skäply',
        'description': 'Motor interactivo 3D para visualizar y montar muebles',
        'url': 'https://skaply.ovh/motor',
        'applicationCategory': 'ProductionApplication',
      }
    });
  }

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