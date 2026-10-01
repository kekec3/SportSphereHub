import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  create(items: { equipmentId: string; quantity: number }[]) {
    return this.http.post<any>(`${this.url}/orders`, { items });
  }

  mine() {
    return this.http.get<any[]>(`${this.url}/orders/mine`);
  }

  cancel(id: string) {
    return this.http.put<any>(`${this.url}/orders/${id}/cancel`, {});
  }

  ownerList() {
    return this.http.get<any[]>(`${this.url}/orders/owner`);
  }

  pickup(id: string) {
    return this.http.put<any>(`${this.url}/orders/${id}/pickup`, {});
  }

  decline(id: string) {
    return this.http.put<any>(`${this.url}/orders/${id}/decline`, {});
  }
}
