import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FurnitureAssemblyDto } from '../types';

@Injectable({ providedIn: 'root' })
export class FurnitureAssemblyApiService {
  constructor(private http: HttpClient) {}

  // Url to backend:
  // furniture-assembly-api.service.ts
  async getAssemblyByFurnitureId(id: number): Promise<FurnitureAssemblyDto> {
  return await firstValueFrom(
  this.http.get<FurnitureAssemblyDto>(`/api/furniture/${id}/assembly`)
  );
  }
}
