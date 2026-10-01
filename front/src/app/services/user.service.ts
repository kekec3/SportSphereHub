import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  getMe() {
    return this.http.get<any>(`${this.url}/users/me`);
  }

  updateMe(payload: any) {
    return this.http.put<any>(`${this.url}/users/me`, payload);
  }

  adminList() {
    return this.http.get<any[]>(`${this.url}/users`);
  }

  adminUpdate(id: string, payload: any) {
    return this.http.put<any>(`${this.url}/users/${id}`, payload);
  }

  adminDelete(id: string) {
    return this.http.delete<any>(`${this.url}/users/${id}`);
  }
}
