// NOTA: separamos los servicios según entidad?

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FilterOptions, Issue } from '../types'; //filter 

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  //MUEBLES
  getFurnitures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/furniture`);
  }

  getFurnitureById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/furniture/${id}`);
  }

  getFilteredFurniture(filters: FilterOptions): Observable<any> { // filter
    return this.http.post(`${this.apiUrl}/furniture/filter`, filters);
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  getColors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/colors`);
  }

  //PROVEEDORES
  getProviders(): Observable<any> {
    return this.http.get(`${this.apiUrl}/providers`);
  }

  registerProvider(data: any): Observable<any> {
    const payload = {
      ...data,
      role: 'provider',
      new_user: true
    };
    return this.http.post(`${this.apiUrl}/providers`, payload);
  }

  deleteProvider(providerId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/providers/${providerId}`);
  }

  postIssue(furnitureId: number, issue: Omit<Issue, 'furniture_id'>): Observable<Issue> {
    return this.http.post<Issue>(`${this.apiUrl}/furniture/${furnitureId}/issues`, issue);
  }
}