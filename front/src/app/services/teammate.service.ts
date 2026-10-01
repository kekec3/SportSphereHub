import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class TeammateService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  list(sport: string, city: string, date: string) {
    const params: string[] = [];
    if (sport) params.push(`sport=${sport}`);
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (date) params.push(`date=${date}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.url}/teammates${q}`);
  }

  mine() {
    return this.http.get<any[]>(`${this.url}/teammates/mine`);
  }

  create(payload: any) {
    return this.http.post<any>(`${this.url}/teammates`, payload);
  }

  join(id: string) {
    return this.http.post<any>(`${this.url}/teammates/${id}/join`, {});
  }

  close(id: string) {
    return this.http.put<any>(`${this.url}/teammates/${id}/close`, {});
  }

  respond(requestId: string, action: 'approved' | 'rejected') {
    return this.http.put<any>(`${this.url}/teammates/requests/${requestId}`, { action });
  }
}
