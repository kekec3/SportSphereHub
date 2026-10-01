import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReservationService } from '../../services/reservation.service';
import { TrainingService } from '../../services/training.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-employee-reservations',
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './employee-reservations.html',
  styleUrl: './employee-reservations.css',
})
export class EmployeeReservations {
  reservationService = inject(ReservationService);
  trainingService = inject(TrainingService);
  objectService = inject(ObjectService);

  tab = signal<'reservations' | 'trainings'>('reservations');
  loading = signal(false);

  objects = signal<any[]>([]);
  reservations = signal<any[]>([]);
  trainings = signal<any[]>([]);

  filterObject = '';
  actionMsg = signal('');
  actionError = signal('');

  ngOnInit() {
    this.objectService.myObjects().subscribe((data) => {
      if (data != null) this.objects.set(data);
    });
    this.reload();
  }

  setTab(t: 'reservations' | 'trainings') {
    this.tab.set(t);
    this.actionMsg.set('');
    this.actionError.set('');
    this.reload();
  }

  reload() {
    this.loading.set(true);
    if (this.tab() === 'reservations') {
      this.reservationService.ownerList(this.filterObject).subscribe({
        next: (data) => {
          this.loading.set(false);
          if (data != null) this.reservations.set(data);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.trainingService.ownerList().subscribe({
        next: (data) => {
          this.loading.set(false);
          if (data != null) this.trainings.set(data);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  confirm(r: any) {
    this.actionMsg.set('');
    this.actionError.set('');
    this.reservationService.confirm(r._id).subscribe((res) => {
      if (res != null && res.message) {
        this.actionMsg.set(res.message);
        this.reload();
      } else if (res != null && res.error) {
        this.actionError.set(res.error);
      }
    });
  }

  noShow(r: any) {
    this.actionMsg.set('');
    this.actionError.set('');
    this.reservationService.noShow(r._id).subscribe((res) => {
      if (res != null && res.message) {
        this.actionMsg.set(res.message);
        this.reload();
      } else if (res != null && res.error) {
        this.actionError.set(res.error);
      }
    });
  }

  statusLabel(s: string) {
    if (s === 'pending') return 'Na čekanju';
    if (s === 'confirmed') return 'Potvrđeno';
    if (s === 'no-show') return 'Nedolazak';
    if (s === 'cancelled') return 'Otkazano';
    return s;
  }

  statusClass(s: string) {
    if (s === 'pending') return 'badge-pending';
    if (s === 'confirmed') return 'badge-confirmed';
    if (s === 'no-show') return 'badge-noshow';
    if (s === 'cancelled') return 'badge-cancelled';
    return '';
  }

  trainingStatusLabel(s: string) {
    if (s === 'scheduled') return 'Zakazan';
    if (s === 'held') return 'Održan';
    if (s === 'cancelled') return 'Otkazan';
    return s;
  }

  trainingStatusClass(s: string) {
    if (s === 'scheduled') return 'badge-scheduled';
    if (s === 'held') return 'badge-held';
    if (s === 'cancelled') return 'badge-cancelled';
    return '';
  }

}
