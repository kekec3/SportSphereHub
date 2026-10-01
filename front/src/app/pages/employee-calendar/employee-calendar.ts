import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CdkDrag, CdkDropList, CdkDropListGroup, CdkDragDrop } from '@angular/cdk/drag-drop';
import { ObjectService } from '../../services/object.service';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-employee-calendar',
  imports: [FormsModule, CdkDrag, CdkDropList, CdkDropListGroup],
  templateUrl: './employee-calendar.html',
  styleUrl: './employee-calendar.css',
})
export class EmployeeCalendar {
  objectService = inject(ObjectService);
  reservationService = inject(ReservationService);

  objects = signal<any[]>([]);
  terrains = signal<any[]>([]);
  selectedObjectId = '';
  selectedResourceId = '';

  workingHours = signal<{ open: string; close: string }>({ open: '08:00', close: '22:00' });
  reservations = signal<any[]>([]);
  weekStart = signal<Date>(this.monday(new Date()));

  message = signal('');
  error = signal('');

  ngOnInit() {
    this.objectService.myObjects().subscribe((data) => {
      if (data != null)
        this.objects.set(data);
    });
  }

  selectedResource = signal<any>(null);

  canMove = computed(() => {
    const resource = this.selectedResource();
    return resource != null && resource.type !== 'open';
  });

  onObjectChange() {
    this.selectedResourceId = '';
    this.terrains.set([]);
    this.selectedResource.set(null);
    this.reservations.set([]);
    this.message.set('');
    this.error.set('');
    if (!this.selectedObjectId)
      return;
    this.objectService.getOwned(this.selectedObjectId).subscribe((data) => {
      if (data != null && data.terrains)
        this.terrains.set(data.terrains);
    });
  }

  onResourceChange() {
    this.message.set('');
    this.error.set('');
    this.selectedResource.set(this.terrains().find((terrain) => terrain._id === this.selectedResourceId) || null);
    if (this.selectedResourceId)
      this.loadWeek();
  }

  loadWeek() {
    if (!this.selectedResourceId)
      return;
    this.reservationService.calendar(this.selectedResourceId, this.dateKey(this.weekStart())).subscribe((data) => {
      if (data == null) {
        this.reservations.set([]);
        return;
      }
      if (data.workingHours)
        this.workingHours.set(data.workingHours);
      this.reservations.set(data.reservations || []);
    });
  }

  days = computed(() => {
    const start = this.weekStart();
    const list: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      list.push(day);
    }
    return list;
  });

  hours = computed(() => {
    const open = parseInt(this.workingHours().open);
    const close = parseInt(this.workingHours().close);
    const list: number[] = [];
    for (let hour = open; hour < close; hour++)
      list.push(hour);
    return list;
  });

  monday(input: Date): Date {
    const x = new Date(input);
    x.setHours(0, 0, 0, 0);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  }

  dateKey(input: Date): string {
    const year = input.getFullYear();
    const month = String(input.getMonth() + 1).padStart(2, '0');
    const day = String(input.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  typeLabel(type: string) {
    if (type === 'open')
      return 'Otvoren';
    if (type === 'closed')
      return 'Zatvoren';
    if (type === 'hall')
      return 'Hala';
    return type;
  }

  cardAt(day: Date, hour: number) {
    const key = this.dateKey(day);
    return (
      this.reservations().find(
        (reservation) => this.dateKey(new Date(reservation.date)) === key && parseInt(reservation.startTime) === hour) || null
    );
  }

  isBooked(day: Date, hour: number) {
    const key = this.dateKey(day);
    return this.reservations().some((reservation) => {
      if (this.dateKey(new Date(reservation.date)) !== key)
        return false;
      return hour >= parseInt(reservation.startTime) && hour < parseInt(reservation.endTime);
    });
  }

  isPast(day: Date, hour: number) {
    const cell = new Date(day);
    cell.setHours(hour, 0, 0, 0);
    return cell.getTime() < Date.now();
  }

  cardLabel(reservation: any) {
    return `${reservation.startTime}–${reservation.endTime}`;
  }

  prevWeek() {
    const day = new Date(this.weekStart());
    day.setDate(day.getDate() - 7);
    this.weekStart.set(day);
    this.loadWeek();
  }

  nextWeek() {
    const day = new Date(this.weekStart());
    day.setDate(day.getDate() + 7);
    this.weekStart.set(day);
    this.loadWeek();
  }

  weekLabel() {
    const list = this.days();
    return `${this.dateKey(list[0]!)} – ${this.dateKey(list[6]!)}`;
  }

  dayLabel(day: Date) {
    const labels = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
    return labels[(day.getDay() + 6) % 7];
  }

  onDrop(event: CdkDragDrop<any>, day: Date, hour: number) {
    this.message.set('');
    this.error.set('');
    const reservation = event.item.data;
    if (reservation == null)
      return;

    const duration = parseInt(reservation.endTime) - parseInt(reservation.startTime);
    const newStart = hour;
    const newEnd = hour + duration;

    const close = parseInt(this.workingHours().close);
    if (newEnd > close) {
      this.error.set('Termin izlazi van radnog vremena objekta.');
      return;
    }
    if (this.isPast(day, newStart)) {
      this.error.set('Ne možete pomeriti termin u prošlost.');
      return;
    }
    if (this.dateKey(new Date(reservation.date)) === this.dateKey(day) && parseInt(reservation.startTime) === newStart)
      return;

    const payload = {
      date: this.dateKey(day),
      startTime: `${String(newStart).padStart(2, '0')}:00`,
      endTime: `${String(newEnd).padStart(2, '0')}:00`,
    };
    this.reservationService.move(reservation._id, payload).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.loadWeek();
      } else {
        this.error.set(res?.error || 'Pomeranje nije uspelo.');
      }
    });
  }

}
