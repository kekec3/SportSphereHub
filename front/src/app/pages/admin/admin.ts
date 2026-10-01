import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { ObjectService } from '../../services/object.service';
import { CoachService } from '../../services/coach.service';
import { SportService } from '../../services/sport.service';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  auth = inject(AuthService);
  userService = inject(UserService);
  objectService = inject(ObjectService);
  coachService = inject(CoachService);
  sportService = inject(SportService);

  tab = signal<'users' | 'requests' | 'objects' | 'coaches' | 'sports'>('users');
  message = signal('');
  error = signal('');

  users = signal<any[]>([]);
  requests = signal<any[]>([]);
  pendingObjects = signal<any[]>([]);
  coaches = signal<any[]>([]);
  sports = signal<any[]>([]);
  approvedObjects = signal<any[]>([]);

  newCoach = { name: '', objectId: '', sport: '', specialization: '', pricePerHour: null as number | null };
  newSport = '';

  roles = ['sportista', 'zaposleni', 'admin'];
  statuses = ['pending', 'approved', 'rejected'];

  ngOnInit() {
    this.loadUsers();
  }

  setTab(tab: 'users' | 'requests' | 'objects' | 'coaches' | 'sports') {
    this.tab.set(tab);
    this.message.set('');
    this.error.set('');
    if (tab === 'users')
      this.loadUsers();
    else if (tab === 'requests')
      this.loadRequests();
    else if (tab === 'objects')
      this.loadPendingObjects();
    else if (tab === 'coaches')
      this.loadCoaches();
    else if (tab === 'sports')
      this.loadSports();
  }

  isSelf(user: any) {
    return this.auth.currentUser()?._id === user._id;
  }

  loadUsers() {
    this.userService.adminList().subscribe((data) => {
      if (data != null)
        this.users.set(data);
    });
  }

  saveUser(user: any) {
    this.message.set('');
    this.error.set('');
    this.userService.adminUpdate(user._id, { role: user.role, status: user.status }).subscribe((res) => {
      if (res != null && res.message)
        this.message.set('Korisnik je izmenjen.');
      else if (res != null && res.error)
        this.error.set(res.error);
    });
  }

  deleteUser(user: any) {
    if (!confirm(`Obrisati korisnika ${user.username}?`))
      return;
    this.userService.adminDelete(user._id).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.loadUsers();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  loadRequests() {
    this.auth.registrationRequests().subscribe((data) => {
      if (data != null)
        this.requests.set(data);
    });
  }

  approveRequest(request: any) {
    this.auth.approveRegistration(request._id).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set('Zahtev je odobren.');
        this.loadRequests();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  rejectRequest(request: any) {
    this.auth.rejectRegistration(request._id).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set('Zahtev je odbijen.');
        this.loadRequests();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  loadPendingObjects() {
    this.objectService.pending().subscribe((data) => {
      if (data != null)
        this.pendingObjects.set(data);
    });
  }

  approveObject(object: any) {
    this.objectService.approve(object._id).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.loadPendingObjects();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  rejectObject(object: any) {
    if (!confirm(`Odbiti i obrisati objekat „${object.name}"?`))
      return;
    this.objectService.reject(object._id).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.loadPendingObjects();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  loadCoaches() {
    this.coachService.adminList().subscribe((data) => {
      if (data != null)
        this.coaches.set(data);
    });
    this.objectService.listApproved().subscribe((data) => {
      if (data != null)
        this.approvedObjects.set(data);
    });
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
  }

  addCoach() {
    this.message.set('');
    this.error.set('');
    this.coachService.create({ ...this.newCoach, pricePerHour: Number(this.newCoach.pricePerHour) }).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.newCoach = { name: '', objectId: '', sport: '', specialization: '', pricePerHour: null };
        this.loadCoaches();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  toggleCoach(coach: any) {
    this.coachService.toggle(coach._id).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.loadCoaches();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  loadSports() {
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
  }

  addSport() {
    this.message.set('');
    this.error.set('');
    const name = this.newSport.trim();
    if (!name)
      return;
    this.sportService.create(name).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.newSport = '';
        this.loadSports();
      } else if (res != null && res.error) {
        this.error.set(res.error);
      }
    });
  }

  roleLabel(role: string) {
    if (role === 'sportista')
      return 'Sportista';
    if (role === 'zaposleni')
      return 'Zaposleni';
    if (role === 'admin')
      return 'Admin';
    return role;
  }

  statusLabel(status: string) {
    if (status === 'pending')
      return 'Na čekanju';
    if (status === 'approved')
      return 'Odobren';
    if (status === 'rejected')
      return 'Odbijen';
    return status;
  }
}
