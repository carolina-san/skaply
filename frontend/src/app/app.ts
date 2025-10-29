import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { Header } from './components/header/header';
import { Home } from './layouts/home/home';
import { Menu } from './components/menu/menu';
import { ResScanner } from './layouts/res-scanner/res-scanner';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Home, Header, Menu, ResScanner, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
