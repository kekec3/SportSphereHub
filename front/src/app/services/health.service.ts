import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HealthService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  check() {
    return this.http.get<{ status: string }>(`${this.url}/health`);
  }
}
