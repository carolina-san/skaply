import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Footer } from '../../components/footer/footer';
import { Legal } from './legal';

@Component({
  selector: 'app-cookies',
  standalone: true,
  imports: [CommonModule, Footer],
  templateUrl: './cookies.html',
  styleUrl: './legal.css'
})
export class Cookies extends Legal implements OnInit {
}

