import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthLayout } from './layouts/auth-layout/auth-layout';
import { AdminLayout } from './layouts/admin-layout/admin-layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AuthLayout, AdminLayout],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('frontend');
}
