import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stats.html',
  styleUrl: './stats.css'
})
export class Stats implements OnInit {
  admins: number = 0;
  providers: number = 0;
  furniture: number = 0;
  overview: any = { activeUsers: 0, newUsers: 0, engagementRate: '0%' };
  topPages: any[] = [];
  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.loadVisits();
    this.loadDashboardStats();
  }

  loadVisits() {
    this.apiService.getVisits().subscribe({
      next: (analyticsData: any) => {
        if (analyticsData.overview) {
          this.overview = analyticsData.overview;
        }
        if (analyticsData.topPages) {
          this.topPages = analyticsData.topPages;
        }
      },
      error: (error: any) => {
        console.error('Error loading analytics:', error);
      }
    });
  }

  loadDashboardStats() {
    this.apiService.getDashboardStats().subscribe({
      next: (stats) => {
        this.admins = stats.admins || 0;
        this.providers = stats.providers || 0;
        this.furniture = stats.furniture || 0;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
      }
    });
  }

  format(title: string): string {
    let furnitureName = title.replace('Montaje 3D de', '');
    furnitureName = furnitureName.replace('- Skäply', '');
    return furnitureName;
  }
}
