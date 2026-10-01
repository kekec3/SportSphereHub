import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StatsService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  dashboard() {
    return this.http.get<any>(`${this.url}/stats/dashboard`);
  }
}
