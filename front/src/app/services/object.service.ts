import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ObjectService {
  http = inject(HttpClient);
  url = environment.apiUrl;

  listApproved() {
    return this.http.get<any[]>(`${this.url}/objects`);
  }

  stats() {
    return this.http.get<any>(`${this.url}/objects/stats`);
  }

  cities() {
    return this.http.get<any[]>(`${this.url}/objects/cities`);
  }

  search(params: { name?: string; city?: string; sport?: string; terrainType?: string; onlyFreeToday?: boolean }) {
    let httpParams = new HttpParams();
    for (const [key, value] of Object.entries(params)) {
      if (value)
        httpParams = httpParams.set(key, value);
    }
    return this.http.get<any[]>(`${this.url}/objects/search`, { params: httpParams });
  }

  getById(id: string) {
    return this.http.get<any>(`${this.url}/objects/${id}`);
  }

  myObjects() {
    return this.http.get<any[]>(`${this.url}/objects/mine`);
  }

  getOwned(id: string) {
    return this.http.get<any>(`${this.url}/objects/mine/${id}`);
  }

  createObject(payload: any) {
    return this.http.post<any>(`${this.url}/objects`, payload);
  }

  importObject(payload: any) {
    return this.http.post<any>(`${this.url}/objects/import`, { data: payload });
  }

  updateObject(id: string, payload: any) {
    return this.http.put<any>(`${this.url}/objects/${id}`, payload);
  }

  addResource(id: string, resource: any) {
    return this.http.post<any>(`${this.url}/objects/${id}/resources`, resource);
  }

  updateResource(id: string, rid: string, resource: any) {
    return this.http.put<any>(`${this.url}/objects/${id}/resources/${rid}`, resource);
  }

  deleteResource(id: string, rid: string) {
    return this.http.delete<any>(`${this.url}/objects/${id}/resources/${rid}`);
  }

  pending() {
    return this.http.get<any[]>(`${this.url}/objects/pending`);
  }

  approve(id: string) {
    return this.http.put<any>(`${this.url}/objects/${id}/approve`, {});
  }

  reject(id: string) {
    return this.http.delete<any>(`${this.url}/objects/${id}`);
  }
}
