import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';
import { Legal } from './legal';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './privacy.html',
  styleUrl: './legal.css'
})
export class Privacy extends Legal implements OnInit {
}

