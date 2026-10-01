import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PromotionService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  active(limit = 3) {
    return this.http.get<any[]>(`${this.url}/promotions/active?limit=${limit}`);
  }

  mine(object = '') {
    const q = object ? `?object=${object}` : '';
    return this.http.get<any[]>(`${this.url}/promotions/mine${q}`);
  }

  create(payload: any) {
    return this.http.post<any>(`${this.url}/promotions`, payload);
  }

  update(id: string, payload: any) {
    return this.http.put<any>(`${this.url}/promotions/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<any>(`${this.url}/promotions/${id}`);
  }
}
