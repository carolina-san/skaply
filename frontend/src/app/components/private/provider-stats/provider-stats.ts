import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';

@Component({
    selector: 'app-provider-stats',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './provider-stats.html',
    styleUrl: './provider-stats.css'
})
export class ProviderStats implements OnInit {
    @Input() providerId!: number;

    stats: any = { furniture: 0, pendingIssues: 0, resolvedIssues: 0 };

    constructor(private apiService: ApiService) { }

    ngOnInit() {
        if (this.providerId) {
            this.loadProviderStats();
        }
    }

    loadProviderStats() {
        this.apiService.getProviderStats(this.providerId).subscribe({
            next: (stats: any) => {
                this.stats = stats || { furniture: 0, pendingIssues: 0, resolvedIssues: 0 };
            },
            error: (error: any) => {
                console.error('Error loading provider stats:', error);
            }
        });
    }
}
