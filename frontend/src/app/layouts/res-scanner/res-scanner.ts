import { Component } from '@angular/core';
import {Header } from '../../components/header/header';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-res-scanner',
  imports: [Header, RouterLink],
  templateUrl: './res-scanner.html',
  styleUrl: './res-scanner.css'
})
export class ResScanner {

}
