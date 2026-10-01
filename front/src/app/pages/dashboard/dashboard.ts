import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Column, SortableTable } from '../../components/sortable-table/sortable-table';

@Component({
  selector: 'app-dashboard',
  imports: [SortableTable],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  auth = inject(AuthService);

  demoColumns: Column[] = [
    { key: 'objekat', label: 'Objekat' },
    { key: 'grad', label: 'Grad' },
    { key: 'termin', label: 'Termin' },
    { key: 'cena', label: 'Cena (RSD)' },
  ];

  demoRows = [
    { objekat: 'Sportski centar Voždovac', grad: 'Beograd', termin: '18:00', cena: 2000 },
    { objekat: 'Hala Pinki', grad: 'Beograd', termin: '19:00', cena: 2500 },
    { objekat: 'Tenis klub As', grad: 'Novi Sad', termin: '10:00', cena: 1800 },
    { objekat: 'SPENS', grad: 'Novi Sad', termin: '20:00', cena: 3000 },
  ];
}
