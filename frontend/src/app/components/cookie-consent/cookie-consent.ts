import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-consent',
  imports: [CommonModule],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.css'
})
export class CookieConsent implements OnInit {
  showConsent = signal(false);
  private readonly CONSENT_KEY = 'cookie-consent-analytics';

  ngOnInit() {
    this.checkConsent();
  }

  private checkConsent() {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    if (!consent) {
      this.showConsent.set(true);
    } else {
      this.loadGoogleAnalytics();
    }
  }

  acceptAnalytics() {
    localStorage.setItem(this.CONSENT_KEY, 'accepted');
    this.showConsent.set(false);
    this.loadGoogleAnalytics();
  }

  rejectAnalytics() {
    localStorage.setItem(this.CONSENT_KEY, 'rejected');
    this.showConsent.set(false);
  }

  private loadGoogleAnalytics() {
    // Cargar Google Analytics 4
    const script1 = document.createElement('script');
    script1.async = true;
    script1.src = 'https://www.googletagmanager.com/gtag/js?id=G-J0HVY0D3M3';
    document.head.appendChild(script1);

    script1.onload = () => {
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(arguments);
      }
      gtag('js', new Date());
      gtag('config', 'G-J0HVY0D3M3');
    };
  }
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: Function;
  }
}
