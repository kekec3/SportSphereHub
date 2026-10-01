import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { ReservationService } from '../../services/reservation.service';

@Component({
  selector: 'app-calendar',
  imports: [],
  templateUrl: './calendar.html',
  styleUrl: './calendar.css',
  host: { '(document:mouseup)': 'endDrag()' },
})
export class Calendar {
  reservationService = inject(ReservationService);

  resourceId = input<string>('');
  workingHours = input<{ open: string, close: string }>({ open: '08:00', close: '22:00' });

  reserved = output<void>();

  weekStart = signal<Date>(this.monday(new Date()));
  booked = signal<Set<string>>(new Set());
  message = signal('');
  error = signal('');

  selectedDay = signal<string | null>(null);
  selectedStart = signal<number | null>(null);
  selectedEnd = signal<number | null>(null);
  anchorHour = signal<number | null>(null);
  dragging = signal(false);

  days = computed(() => {
    const start = this.weekStart();
    let days = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  });

  hours = computed(() => {
    const open = parseInt(this.workingHours().open);
    const close = parseInt(this.workingHours().close);
    const hours = [];
    for (let hour = open; hour < close; hour++)
      hours.push(hour);
    return hours;
  });

  constructor() {
    effect(() => {
      const id = this.resourceId();
      const week = this.weekStart();
      if (id)
        this.loadWeek(id, week)
    });
  }

  monday(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - day);
    return x;
  }

  loadWeek(id: string, week: Date) {
    this.clearSelection();
    this.message.set('');
    this.error.set('');
    this.reservationService.calendar(id, this.dateKey(week)).subscribe((data) => {
      const set = new Set<string>();
      if (data != null && data.reservations) {
        for (const r of data.reservations) {
          const dateK = this.dateKey(new Date(r.date));
          const start = parseInt(r.startTime);
          const end = parseInt(r.endTime);
          for (let hour = start; hour < end; hour++)
            set.add(`${dateK}|${hour}`);
        }
      }
      this.booked.set(set);
    });
  }

  dateKey(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  isBooked(day: Date, hour: number) {
    return this.booked().has(`${this.dateKey(day)}|${hour}`);
  }

  isPast(day: Date, hour: number) {
    const d = new Date(day);
    d.setHours(hour, 0, 0, 0);
    return d.getTime() < Date.now();
  }

  isSelected(day: Date, hour: number) {
    if (this.selectedDay() !== this.dateKey(day) || this.selectedStart() == null)
      return false;
    return hour >= this.selectedStart()! && hour <= this.selectedEnd()!;
  }

  onCellDown(day: Date, hour: number, event: MouseEvent) {
    event.preventDefault();
    if (this.isBooked(day, hour) || this.isPast(day, hour))
      return;
    this.selectedDay.set(this.dateKey(day));
    this.anchorHour.set(hour);
    this.selectedStart.set(hour);
    this.selectedEnd.set(hour);
    this.dragging.set(true);
  }

  onCellEnter(day: Date, hour: number) {
    if (!this.dragging() || this.selectedDay() !== this.dateKey(day))
      return;
    const a = this.anchorHour();
    if (a == null)
      return;
    let start = a;
    let end = a;
    if (hour >= a) {
      for (let x = a; x <= hour; x++) {
        if (this.isBooked(day, x) || this.isPast(day, x))
          break;
        end = x;
      }
    } else {
      for (let x = a; x >= hour; x--) {
        if (this.isBooked(day, x) || this.isPast(day, x))
          break;
        start = x;
      }
    }
    this.selectedStart.set(start);
    this.selectedEnd.set(end);
  }

  endDrag() {
    this.dragging.set(false);
  }

  clearSelection() {
    this.selectedDay.set(null);
    this.selectedStart.set(null);
    this.selectedEnd.set(null);
    this.anchorHour.set(null);
    this.dragging.set(false);
  }

  prevWeek() {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() - 7);
    this.weekStart.set(d);
  }

  nextWeek() {
    const d = new Date(this.weekStart());
    d.setDate(d.getDate() + 7);
    this.weekStart.set(d);
  }

  selectedLabel() {
    if (this.selectedDay() == null || this.selectedStart() == null) return '';
    return `${this.selectedDay()} ${String(this.selectedStart()!).padStart(2, '0')}:00 – ${String(this.selectedEnd()! + 1).padStart(2, '0')}:00`;
  }

  reserve() {
    const day = this.selectedDay();
    const start = this.selectedStart();
    const end = this.selectedEnd();
    if (day == null || start == null || end == null)
      return;

    const payload = {
      resourceId: this.resourceId(),
      date: day,
      startTime: `${String(start).padStart(2, '0')}:00`,
      endTime: `${String(end + 1).padStart(2, '0')}:00`,
    };
    this.error.set('');
    this.message.set('');
    this.reservationService.create(payload).subscribe((res) => {
      if (res != null && res.message) {
        this.message.set(res.message);
        this.clearSelection();
        this.loadWeek(this.resourceId(), this.weekStart());
        this.reserved.emit();
      } else {
        this.error.set(res?.error || 'Rezervacija nije uspela.');
      }
    });
  }

  weekLabel() {
    const days = this.days()
    return `${this.dateKey(days[0]!)}-${this.dateKey(days[6]!)}`;
  }

  dayLabel(d: Date) {
    const labels = ['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'];
    return labels[(d.getDay() + 6) % 7];
  }
}
