import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoachService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  list(object: string, sport: string) {
    const params: string[] = [];
    if (object)
      params.push(`object=${object}`);
    if (sport)
      params.push(`sport=${sport}`);
    const q = params.length ? `?${params.join('&')}` : '';
    return this.http.get<any[]>(`${this.url}/coaches${q}`);
  }

  adminList() {
    return this.http.get<any[]>(`${this.url}/coaches/all`);
  }
  create(payload: any) {
    return this.http.post<any>(`${this.url}/coaches`, payload);
  }
  toggle(id: string) {
    return this.http.put<any>(`${this.url}/coaches/${id}/toggle`, {});
  }
}
