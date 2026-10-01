import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RatingService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  getForObject(objectId: string) {
    return this.http.get<any>(`${this.url}/ratings/object/${objectId}`);
  }

  create(payload: { objectId: string; like: boolean; comment: string }) {
    return this.http.post<any>(`${this.url}/ratings`, payload);
  }
}
