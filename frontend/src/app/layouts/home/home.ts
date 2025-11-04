import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../components/header/header';
import { Chatbot } from '../../components/chatbot/chatbot';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Footer } from '../../components/footer/footer';

@Component({
  selector: 'app-home',
  imports: [Header, Chatbot, RouterLink, Footer, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  categories: any[] = [];
  furnitures: any[] = [];

  constructor(private apiService: ApiService) { }

  ngOnInit() {
    this.obtenerCategorias();
    this.obtenerCatalogo();
  }

  obtenerCatalogo() {
    this.apiService.getFurnitures().subscribe(data => {
      console.log('Catálogo de muebles:', data);
      this.furnitures = data.data; //muebles al array
    }, error => {
      console.error('Error al obtener el catálogo de muebles:', error);
    });
  }

  obtenerCategorias() {
    this.apiService.getCategories().subscribe(data => {
      console.log('Categorías:', data);
      this.categories = data.data; //categorias al array
    }, error => {
      console.error('Error al obtener las categorías:', error);
    });
  }
}
