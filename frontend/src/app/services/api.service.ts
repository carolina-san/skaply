import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FilterOptions, Issue } from '../types';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = '/api';

  constructor(private http: HttpClient) { }

  //MUEBLES
  getAllFurniture(page?: number, limit?: number): Observable<any> {
    let url = `${this.apiUrl}/furniture`;
    if (page && limit) {
      url += `?page=${page}&limit=${limit}`;
    }
    return this.http.get(url);
  }

  getVisibleFurniture(): Observable<any> {
    return this.http.get(`${this.apiUrl}/furniture/visible`);
  }

  getFurnitureById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/furniture/${id}`);
  }

  getFurnitureAssemblyById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/furniture/${id}/assembly`);
  }

  getFilteredFurniture(filters: FilterOptions): Observable<any> { // filter
    console.log('Filters sent to API Service:', filters);
    return this.http.post(`${this.apiUrl}/furniture/filter`, filters);
  }

  updateFurniture(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/private/furniture/${id}`, data);
  }

  updateProvider(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/private/providers/${id}`, data);
  }

  deleteFurniture(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/private/furniture/${id}`);
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`);
  }

  getCategoryByName(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/name/${name}`);
  }

  getCategoryById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/${id}`);
  }

  getColors(): Observable<any> {
    return this.http.get(`${this.apiUrl}/colors`);
  }

  getColorByName(name: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/colors/name/${name}`);
  }

  getProviderById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/providers/${id}`);
  }

  getVisibleProviders(): Observable<any> { // Modificado para obtener solo proveedores activos
    return this.http.get(`${this.apiUrl}/providers`);
  }

  getProviders(page: number = 1, limit: number = 10, search: string = '', visible: boolean | null = null): Observable<any> { // Obteniendo todos los proveedores (ruta privada)
    let url = `${this.apiUrl}/private/providers?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${search}`;
    }
    if (visible !== null) {
      url += `&visible=${visible}`;
    }
    return this.http.get(url);
  }



  // tambien existe register()
  // el front no debería de enviar datos hardcodeados al back
  registerProvider(data: any): Observable<any> {
    const payload = {
      ...data,
      role: 'provider',
      registration_status: 'pending',
      enabled: false,
      visible: false,
    };
    return this.http.post(`${this.apiUrl}/providers`, payload);
  }

  deleteProvider(providerId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/providers/${providerId}`);
  }

  postIssue(furnitureId: number, issue: Omit<Issue, 'furniture_id'>): Observable<Issue> {
    return this.http.post<Issue>(`${this.apiUrl}/furniture/${furnitureId}/issues`, issue);
  }

  sendChatbotMessage(text: string): Observable<any> {
    const sessionId = sessionStorage.getItem('chatbot_session');
    return this.http.post(`${this.apiUrl}/chatbot`, { text, sessionId });
  }

  initAssembly(furniture_ref: string): Observable<any> {
    const sessionId = sessionStorage.getItem('chatbot_session');
    return this.http.post(`${this.apiUrl}/chatbot/start`, { furniture_ref, sessionId });
  }

  resetAssembly(): Observable<any> {
    const sessionId = sessionStorage.getItem('chatbot_session');
    return this.http.post(`${this.apiUrl}/chatbot/reset`, { sessionId });
  }

  sendWelcomeEvent(): Observable<any> {
    const sessionId = sessionStorage.getItem('chatbot_session');
    return this.http.post(`${this.apiUrl}/chatbot/welcome`, { sessionId });
  }

  // Métodos de autenticación
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password });
  }

  register(userData: any): Observable<any> { // tambien existe registerProvider()
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  // Google OAuth - simplemente redirige al backend
  loginWithGoogle(): void {
    window.location.href = `${this.apiUrl}/auth/google`;
  }

  // Reseñas
  postReview(furnitureId: number, stars: number, text?: string): Observable<any> {
    const body: any = { stars };
    if (text) {
      body.text = text;
    }
    return this.http.post(`${this.apiUrl}/furniture/${furnitureId}/reviews`, body);
  }
}