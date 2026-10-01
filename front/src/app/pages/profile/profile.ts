import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FileUpload } from '../../components/file-upload/file-upload';
import { AvatarGenerator } from '../../components/avatar-generator/avatar-generator';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { SportService } from '../../services/sport.service';
import { ReservationService } from '../../services/reservation.service';
import { TrainingService } from '../../services/training.service';
import { environment } from '../../../environments/environment';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, DatePipe, FileUpload, AvatarGenerator],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  auth = inject(AuthService);
  userService = inject(UserService);
  sportService = inject(SportService);
  reservationService = inject(ReservationService);
  trainingService = inject(TrainingService);
  orderService = inject(OrderService);

  apiUrl = environment.apiUrl

  username = '';
  firstName = '';
  lastName = '';
  phone = '';
  email = '';

  favoriteSports = signal<string[]>([]);
  avatar = signal('');
  currentAvatarUrl = signal('');
  avatarMode = signal<'keep' | 'upload' | 'generate'>('keep');

  sports = signal<any[]>([]);
  reservations = signal<any[]>([]);
  trainings = signal<any[]>([]);
  orders = signal<any[]>([]);

  sortKey = signal('');
  sortDir = signal<'asc' | 'desc'>('asc');

  error = signal('');
  success = signal('');
  loading = signal(false);

  sortedReservations = computed(() => {
    const key = this.sortKey();
    const data = [...this.reservations()];
    if (!key)
      return data;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      return String(valA).localeCompare(String(valB), 'sr') * dir;
    });
  });

  ngOnInit() {
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
    this.loadProfile();
    this.loadReservations();
    this.loadTrainings();
    this.loadOrders();
  }

  loadProfile() {
    this.userService.getMe().subscribe((u) => {
      if (u != null) {
        this.username = u.username;
        this.firstName = u.firstName;
        this.lastName = u.lastName;
        this.phone = u.phone;
        this.email = u.email;
        this.currentAvatarUrl.set(u.avatarUrl);
        this.favoriteSports.set((u.favoriteSports || []).map((s: any) => (typeof s === 'string' ? s : s._id)));
      }
    });
  }

  loadReservations() {
    this.reservationService.mine().subscribe((data) => {
      if (data != null)
        this.reservations.set(data);
    });
  }

  loadTrainings() {
    this.trainingService.mine().subscribe((data) => {
      if (data != null)
        this.trainings.set(data);
    });
  }

  cancelTraining(t: any) {
    if (!confirm('Jeste li sigurni da želite da otkažete trening?'))
      return;
    this.trainingService.cancel(t._id).subscribe((res) => {
      if (res != null && res.message) {
        this.loadTrainings();
      } else {
        this.error.set(res?.error || 'Otkazivanje nije uspelo.');
      }
    });
  }

  trainingStatusLabel(status: string) {
    if (status === 'scheduled') return 'Zakazan';
    if (status === 'held') return 'Održan';
    if (status === 'cancelled') return 'Otkazan';
    return status;
  }

  toggleSport(id: string) {
    const current = this.favoriteSports();
    if (current.includes(id)) {
      this.favoriteSports.set(current.filter((s) => s !== id));
    } else if (current.length < 5) {
      this.favoriteSports.set([...current, id]);
    }
  }

  isSelected(id: string) {
    return this.favoriteSports().includes(id);
  }

  onAvatar(base64: string) {
    this.avatar.set(base64);
  }

  save() {
    this.error.set('');
    this.success.set('');
    const payload: any = {
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      email: this.email,
      favoriteSports: this.favoriteSports(),
    };
    if (this.avatar())
      payload.avatar = this.avatar();

    this.loading.set(true);
    this.userService.updateMe(payload).subscribe({
      next: (u) => {
        this.loading.set(false);
        if (u != null && u._id) {
          this.success.set('Podaci su sačuvani.');
          this.auth.setUser(u);
          this.currentAvatarUrl.set(u.avatarUrl);
          this.avatar.set('');
          this.avatarMode.set('keep');
        } else {
          this.error.set(u?.error || 'Čuvanje nije uspelo.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Greška pri povezivanju sa serverom.');
      },
    });
  }

  cancelReservation(r: any) {
    if (!confirm('Jeste li sigurni da želite da otkažete rezervaciju?'))
      return;
    this.reservationService.cancel(r._id).subscribe((res) => {
      if (res != null && res.message) {
        this.loadReservations();
      } else {
        this.error.set(res?.error || 'Otkazivanje nije uspelo.');
      }
    });
  }

  sortBy(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  indicator(key: string) {
    if (this.sortKey() !== key)
      return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  typeLabel(type: string) {
    if (type === 'open') return 'Otvoreni';
    if (type === 'closed') return 'Zatvoreni';
    if (type === 'hall') return 'Hala';
    return type;
  }

  statusLabel(status: string) {
    if (status === 'pending') return 'Na čekanju';
    if (status === 'confirmed') return 'Potvrđeno';
    if (status === 'no-show') return 'Nije se pojavio';
    if (status === 'cancelled') return 'Otkazano';
    return status;
  }

  loadOrders() {
    this.orderService.mine().subscribe((data) => {
      if (data != null)
        this.orders.set(data);
    });
  }

  cancelOrder(o: any) {
    if (!confirm('Jeste li sigurni da želite da otkažete porudžbinu?'))
      return;
    this.orderService.cancel(o._id).subscribe((res) => {
      if (res != null && res.message) {
        this.loadOrders();
      } else {
        this.error.set(res?.error || 'Otkazivanje nije uspelo.');
      }
    });
  }

  orderStatusLabel(status: string) {
    if (status === 'ordered') return 'Naručeno';
    if (status === 'picked-up') return 'Preuzeto';
    if (status === 'cancelled') return 'Otkazano';
    return status;
  }
}
