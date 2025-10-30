import { Component } from '@angular/core';
import { Header } from '../../components/header/header';
import { Chatbot } from '../../components/chatbot/chatbot';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  
  constructor(private apiService: ApiService) {}

  obtenerCatalogo() {
    this.apiService.getFurnitures().subscribe(data => {
      console.log('Catálogo de muebles:', data);
    }, error => {
      console.error('Error al obtener el catálogo de muebles:', error);
    });
  }
}
