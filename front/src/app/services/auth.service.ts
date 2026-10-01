import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { User } from '../models/userModel';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  http = inject(HttpClient);
  router = inject(Router);
  url = environment.apiUrl;

  currentUser = signal<User | null>(this.loadUser());
  token = signal<string | null>(localStorage.getItem('token'));

  loadUser(): User | null {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${this.url}/auth/login`, { username, password });
  }

  register(payload: any) {
    return this.http.post<any>(`${this.url}/auth/register`, payload);
  }

  forgotPassword(usernameOrEmail: string) {
    return this.http.post<any>(`${this.url}/auth/forgot-password`, { usernameOrEmail });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<any>(`${this.url}/auth/reset-password/${token}`, { password });
  }

  me() {
    return this.http.get<User>(`${this.url}/users/me`);
  }

  setSession(data: any) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    this.token.set(data.token);
    this.currentUser.set(data.user);
  }

  setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    return !!this.token();
  }

  role() {
    return this.currentUser()?.role ?? null;
  }

  homePath(): string {
    const role = this.role();
    if (role === 'admin') return '/admin';
    if (role === 'zaposleni') return '/zaposleni';
    if (role === 'sportista') return '/';
    return '/';
  }

  registrationRequests() {
    return this.http.get<any[]>(`${this.url}/auth/registration-requests`);
  }

  approveRegistration(id: string) {
    return this.http.post<any>(`${this.url}/auth/registration-requests/${id}/approve`, {});
  }

  rejectRegistration(id: string) {
    return this.http.post<any>(`${this.url}/auth/registration-requests/${id}/reject`, {});
  }
}
