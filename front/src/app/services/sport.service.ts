import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SportService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  list() {
    return this.http.get<any[]>(`${this.url}/sports`)
  }

  create(name: string) {
    return this.http.post<any>(`${this.url}/sports`, { name });
  }
}
