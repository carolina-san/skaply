import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsentService } from '../../../services/consent.service';

@Component({
  selector: 'app-cookie-consent',
  imports: [CommonModule],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.css'
})
export class CookieConsent implements OnInit {
  constructor(public consentService: ConsentService) { }

  ngOnInit() {
    this.checkConsent();
  }

  private checkConsent() {
    if (!this.consentService.isConsentGiven()) {
      this.consentService.showConsentModal.set(true);
    } else if (this.consentService.hasConsented()) {
      this.consentService.loadGoogleAnalytics();
    } else if (this.consentService.hasRejected()) {
      // Si rechazó, asegurar que se limpien cualquier cookie existente
      this.consentService.clearGoogleAnalyticsCookies();
    }
  }

  acceptAnalytics() {
    this.consentService.acceptAnalytics();
  }

  rejectAnalytics() {
    this.consentService.rejectAnalytics();
  }
}
