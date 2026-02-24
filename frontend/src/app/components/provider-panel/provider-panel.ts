import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, User } from '../../services/auth.service';

@Component({
  selector: 'app-provider-panel',
  imports: [CommonModule],
  templateUrl: './provider-panel.html',
  styleUrl: './provider-panel.css'
})
export class ProviderPanel {
  currentUser: User | null = null;

  constructor(private authService: AuthService) { }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      console.log(user);
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
  }
}
