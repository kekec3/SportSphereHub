import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EquipmentService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  list(sport: string, object: string) {
    const params: string[] = [];
    if (sport)
      params.push(`sport=${sport}`);
    if (object)
      params.push(`object=${object}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.url}/equipment${q}`);
  }

  mine(object = '') {
    const q = object ? `?object=${object}` : '';
    return this.http.get<any[]>(`${this.url}/equipment/mine${q}`);
  }

  create(payload: any) {
    return this.http.post<any>(`${this.url}/equipment`, payload);
  }

  update(id: string, payload: any) {
    return this.http.put<any>(`${this.url}/equipment/${id}`, payload);
  }

  remove(id: string) {
    return this.http.delete<any>(`${this.url}/equipment/${id}`);
  }
}
