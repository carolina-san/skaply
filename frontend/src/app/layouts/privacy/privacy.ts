import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy.html',
  styleUrls: ['./privacy.css']
})
export class Privacy {
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
