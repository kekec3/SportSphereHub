import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CoachService } from '../../services/coach.service';
import { TrainingService } from '../../services/training.service';
import { SportService } from '../../services/sport.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-trainings',
  imports: [FormsModule],
  templateUrl: './trainings.html',
  styleUrl: './trainings.css',
})
export class Trainings {
  coachService = inject(CoachService);
  trainingService = inject(TrainingService);
  sportService = inject(SportService);
  objectService = inject(ObjectService);

  coaches = signal<any[]>([]);
  sports = signal<any[]>([]);
  objects = signal<any[]>([]);
  loading = signal(false);

  filterObject = '';
  filterSport = '';

  // inline booking form state
  selectedCoachId = signal('');
  bookDate = '';
  bookStart = '';
  bookEnd = '';
  formError = signal('');
  formSuccess = signal('');

  ngOnInit() {
    this.sportService.list().subscribe((data) => {
      if (data != null) this.sports.set(data);
    });
    this.objectService.listApproved().subscribe((data) => {
      if (data != null) this.objects.set(data);
    });
    this.loadCoaches();
  }

  loadError = signal('');

  loadCoaches() {
    this.loading.set(true);
    this.loadError.set('');
    this.coachService.list(this.filterObject, this.filterSport).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null) this.coaches.set(data);
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set('Ne mogu da učitam trenere. Proverite da li je server pokrenut.');
      },
    });
  }

  resetFilters() {
    this.filterObject = '';
    this.filterSport = '';
    this.loadCoaches();
  }

  openBooking(coach: any) {
    this.formError.set('');
    this.formSuccess.set('');
    this.bookDate = '';
    this.bookStart = '';
    this.bookEnd = '';
    this.selectedCoachId.set(this.selectedCoachId() === coach._id ? '' : coach._id);
  }

  book(coach: any) {
    this.formError.set('');
    this.formSuccess.set('');
    if (!this.bookDate || !this.bookStart || !this.bookEnd) {
      this.formError.set('Popunite datum i vreme.');
      return;
    }
    const payload = {
      coachId: coach._id,
      date: this.bookDate,
      startTime: this.bookStart,
      endTime: this.bookEnd,
    };
    this.trainingService.create(payload).subscribe((res) => {
      if (res != null && res.message) {
        this.formSuccess.set('Trening je uspešno zakazan.');
        this.bookDate = '';
        this.bookStart = '';
        this.bookEnd = '';
        this.selectedCoachId.set('');
      } else if (res != null && res.error) {
        this.formError.set(res.error);
      }
    });
  }
}
