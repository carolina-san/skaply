import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FurnitureAssembly } from '../types';

@Injectable({ providedIn: 'root' })
export class FurnitureAssemblyApiService {
  constructor(private http: HttpClient) { }

  // Url to backend:
  // furniture-assembly-api.service.ts
  async getAssemblyByFurnitureId(id: number): Promise<FurnitureAssembly> {
    return await firstValueFrom(
      this.http.get<FurnitureAssembly>(`/api/furniture/${id}/assembly`)
    );
  }
}
