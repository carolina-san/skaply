import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class Profile {
  providers: any[] = [];

  constructor(private apiService: ApiService) {
    this.fetchProviders();
  }

  fetchProviders() {
    this.apiService.getProviders().subscribe((res: any) => {
      this.providers = res.data || []; 
    });
  }
}
