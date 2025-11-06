// NOTA: separamos los servicios según entidad?

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FilterOptions } from '../types'; //filter 

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  //Obtener muebles
  getFurnitures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/furniture`);
  }

  // Obtener muebles filtrados
  getFilteredFurniture(filters: FilterOptions): Observable<any> { // filter
    return this.http.post(`${this.apiUrl}/furniture/filter`, filters);
  }

  //Obtener categorias
  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  getProviders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/providers`);
  }

  getColors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/colors`);
  }
}