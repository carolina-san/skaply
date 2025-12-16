import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';
import { Legal } from './legal';

@Component({
  selector: 'app-legal-notice',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './legal-notice.html',
  styleUrl: './legal.css'
})
export class LegalNotice extends Legal implements OnInit {
}

