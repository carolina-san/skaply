import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConsentService {
  showConsentModal = signal(false);
  private readonly CONSENT_KEY = 'cookie-consent-analytics';
  private consentGiven = false;

  openConsentModal() {
    this.showConsentModal.set(true);
  }

  closeConsentModal() {
    this.showConsentModal.set(false);
  }

  acceptAnalytics() {
    localStorage.setItem(this.CONSENT_KEY, 'accepted');
    this.consentGiven = true;
    this.closeConsentModal();
    this.loadGoogleAnalytics();
  }

  rejectAnalytics() {
    localStorage.setItem(this.CONSENT_KEY, 'rejected');
    this.consentGiven = false;
    this.closeConsentModal();
    this.clearGoogleAnalyticsCookies();
  }

  hasConsented(): boolean {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    return consent === 'accepted';
  }

  hasRejected(): boolean {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    return consent === 'rejected';
  }

  isConsentGiven(): boolean {
    return localStorage.getItem(this.CONSENT_KEY) !== null;
  }

  loadGoogleAnalytics() {
    // Verificar si el usuario ha rechazado explícitamente
    if (this.hasRejected()) {
      this.clearGoogleAnalyticsCookies();
      return;
    }

    // Bloquear Google Analytics a nivel de ventana
    if (window.dataLayer === undefined) {
      window.dataLayer = [];
    }

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

  clearGoogleAnalyticsCookies() {
    // Función para eliminar una cookie de múltiples formas
    const deleteCookie = (name: string) => {
      // Método 1: Usar max-age=0 sin dominio
      document.cookie = `${name}=;max-age=0;path=/`;
      
      // Método 2: Con dominio actual
      const domain = window.location.hostname;
      document.cookie = `${name}=;max-age=0;path=/;domain=${domain}`;
      
      // Método 3: Con dominio raíz (ej: .skaply.ovh)
      const rootDomain = domain.split('.').slice(-2).join('.');
      document.cookie = `${name}=;max-age=0;path=/;domain=.${rootDomain}`;
      
      // Método 4: Con dominio raíz sin punto
      if (rootDomain !== domain) {
        document.cookie = `${name}=;max-age=0;path=/;domain=${rootDomain}`;
      }
      
      // Método 5: Fecha expirada (formato alternativo)
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=${domain}`;
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;domain=.${rootDomain}`;
    };

    // Eliminar las cookies específicas de Google Analytics
    deleteCookie('_ga');
    deleteCookie('_ga_J0HVY0D3M3');
    deleteCookie('_gat');
    deleteCookie('_gid');
    
    // Limpiar el dataLayer si existe
    if (window.dataLayer) {
      window.dataLayer = [];
    }

    // Eliminar los scripts de Google Analytics del DOM
    const scripts = document.querySelectorAll('script[src*="googletagmanager"]');
    scripts.forEach(script => {
      script.remove();
    });

    // Marcar que el usuario rechazó el consentimiento
    this.consentGiven = false;
  }
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: Function;
  }
}
