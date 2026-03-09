import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './components/UI/header/header';
import { CookieConsent } from './components/UI/cookie-consent/cookie-consent';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [RouterOutlet, Header, CookieConsent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
