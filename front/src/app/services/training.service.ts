import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TrainingService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  create(payload: any) {
    return this.http.post<any>(`${this.url}/trainings`, payload);
  }

  mine() {
    return this.http.get<any[]>(`${this.url}/trainings/mine`);
  }

  cancel(id: string) {
    return this.http.put<any>(`${this.url}/trainings/${id}/cancel`, {});
  }

  ownerList() {
    return this.http.get<any[]>(`${this.url}/trainings/owner`);
  }
}
