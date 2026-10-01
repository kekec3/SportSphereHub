import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  mine() {
    return this.http.get<any[]>(`${this.url}/reservations/mine`);
  }

  cancel(id: string) {
    return this.http.put<any>(`${this.url}/reservations/${id}/cancel`, {});
  }

  calendar(resourceId: string, weekStart: string) {
    return this.http.get<any>(`${this.url}/resources/${resourceId}/calendar?weekStart=${weekStart}`);
  }

  create(payload: any) {
    return this.http.post<any>(`${this.url}/reservations`, payload);
  }

  ownerList(object = '') {
    const q = object ? `?object=${object}` : '';
    return this.http.get<any[]>(`${this.url}/reservations/owner${q}`);
  }

  confirm(id: string) {
    return this.http.put<any>(`${this.url}/reservations/${id}/confirm`, {});
  }

  noShow(id: string) {
    return this.http.put<any>(`${this.url}/reservations/${id}/no-show`, {});
  }

  move(id: string, payload: any) {
    return this.http.put<any>(`${this.url}/reservations/${id}/move`, payload);
  }
}
