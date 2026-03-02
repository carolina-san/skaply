import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class Stats implements OnInit {
  visits: number = 0;
  users: number = 0;
  providers: number = 0;
  furniture: number = 0;

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadVisits();
    this.loadDashboardStats();
  }

  loadVisits() {
    this.apiService.getVisits().subscribe({
      next: (visits) => {
        this.visits = visits;
      },
      error: (error) => {
        console.error('Error loading visits:', error);
      }
    });
  }

  loadDashboardStats() {
    this.apiService.getDashboardStats().subscribe({
      next: (stats) => {
        this.users = stats.users || 0;
        this.providers = stats.providers || 0;
        this.furniture = stats.furniture || 0;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });
  }
}
