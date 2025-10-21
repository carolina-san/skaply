import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  template: `
    <h1>{{ mensaje }}</h1>
  `,
})
export class AppComponent implements OnInit {
  mensaje = 'Cargando...';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<{ mensaje: string }>('http://localhost:3000/api/saludo')
      .subscribe((res) => this.mensaje = res.mensaje);
  }
}
