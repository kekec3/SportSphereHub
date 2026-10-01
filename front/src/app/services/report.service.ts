import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  occupancy(objectId: string, month: string) {
    return this.http.get(`${this.url}/reports/occupancy?object=${objectId}&month=${month}`, {
      responseType: 'blob',
    });
  }

  turnover(objectId: string, month: string) {
    return this.http.get(`${this.url}/reports/turnover?object=${objectId}&month=${month}`, {
      responseType: 'blob',
    });
  }

}
