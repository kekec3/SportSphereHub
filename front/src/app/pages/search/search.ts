import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Column, SortableTable } from '../../components/sortable-table/sortable-table';
import { ObjectService } from '../../services/object.service';
import { SportService } from '../../services/sport.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-search',
  imports: [FormsModule, SortableTable],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  objectService = inject(ObjectService);
  sportService = inject(SportService);
  router = inject(Router);
  auth = inject(AuthService);

  name = '';
  cityList: string[] = [];
  sport = '';
  terrainType = '';
  onlyFreeToday = false;

  cities = signal<any[]>([]);
  sports = signal<any[]>([]);
  results = signal<any[]>([]);
  searched = signal(false);

  columns: Column[] = [
    { key: 'name', label: 'Naziv' },
    { key: 'city', label: 'Grad' },
    { key: 'address', label: 'Adresa' },
    { key: 'sportNames', label: 'Sport' },
    { key: 'pricePerHour', label: 'Cena: RSD/h' },
    { key: 'likeCount', label: 'Sviđanja' },
  ];

  ngOnInit() {
    this.objectService.cities().subscribe((data) => {
      if (data != null)
        this.cities.set(data);
    });
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
    this.runSearch();
  }

  runSearch() {
    this.objectService.search({
      name: this.name,
      city: this.cityList.join(','),
      sport: this.sport,
      terrainType: this.terrainType,
      onlyFreeToday: this.onlyFreeToday,
    }).subscribe((data) => {
      if (data != null)
        this.results.set(data);
      this.searched.set(true);
    });
  }

  reset() {
    this.name = '';
    this.cityList = [];
    this.sport = '';
    this.terrainType = '';
    this.onlyFreeToday = false;
    this.runSearch();
  }

  openDetails(row: any) {
    this.router.navigate(['/objects', row._id]);
  }
}
