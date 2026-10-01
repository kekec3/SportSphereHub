import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeammateService } from '../../services/teammate.service';
import { SportService } from '../../services/sport.service';

@Component({
  selector: 'app-teammates',
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './teammates.html',
  styleUrl: './teammates.css',
})
export class Teammates {
  teammateService = inject(TeammateService);
  sportService = inject(SportService);

  tab = signal<'browse' | 'mine'>('browse');
  sports = signal<any[]>([]);
  ads = signal<any[]>([]);
  myAds = signal<any[]>([]);
  loading = signal(false);
  formError = signal('');

  filterSport = '';
  filterCity = '';
  filterDate = '';

  newSport = '';
  newCity = '';
  newDate = '';
  newTime = '';
  newMissing = 1;

  ngOnInit() {
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
    this.loadAds();
    this.loadMine();
  }

  loadAds() {
    this.loading.set(true);
    this.teammateService.list(this.filterSport, this.filterCity, this.filterDate).subscribe((data) => {
      this.loading.set(false);
      if (data != null)
        this.ads.set(data);
    });
  }

  loadMine() {
    this.teammateService.mine().subscribe((data) => {
      if (data != null)
        this.myAds.set(data);
    });
  }

  setTab(tab: 'browse' | 'mine') {
    this.tab.set(tab);
    if (tab === 'browse') this.loadAds();
    else this.loadMine();
  }

  resetFilters() {
    this.filterSport = '';
    this.filterCity = '';
    this.filterDate = '';
    this.loadAds();
  }

  createAd() {
    this.formError.set('');
    if (!this.newSport || !this.newCity || !this.newDate || !this.newTime || !this.newMissing) {
      this.formError.set('Popunite sva polja.');
      return;
    }
    const payload = {
      sport: this.newSport,
      city: this.newCity,
      date: this.newDate,
      time: this.newTime,
      missingPlayers: this.newMissing,
    };
    this.teammateService.create(payload).subscribe((res) => {
      if (res != null && res.message) {
        this.newSport = '';
        this.newCity = '';
        this.newDate = '';
        this.newTime = '';
        this.newMissing = 1;
        this.loadMine();
      } else if (res != null && res.error) {
        this.formError.set(res.error);
      }
    });
  }

  join(ad: any) {
    this.teammateService.join(ad._id).subscribe((res) => {
      if (res != null && res.message) {
        ad.requestStatus = 'pending';
      } else if (res != null && res.error) {
        alert(res.error);
      }
    });
  }


  close(ad: any) {
    this.teammateService.close(ad._id).subscribe((res) => {
      if (res != null && res.message) {
        this.loadMine();
        this.loadAds();
      }
    });
  }

  respond(ad: any, request: any, action: 'approved' | 'rejected') {
    this.teammateService.respond(request._id, action).subscribe((res) => {
      if (res != null && res.message) {
        this.loadMine();
        this.loadAds();
      } else if (res != null && res.error) {
        alert(res.error);
      }
    });
  }
}
