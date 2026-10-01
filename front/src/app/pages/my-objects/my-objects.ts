import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ObjectService } from '../../services/object.service';
import { SportService } from '../../services/sport.service';
import { FileUpload } from '../../components/file-upload/file-upload';

@Component({
  selector: 'app-my-objects',
  imports: [FormsModule, RouterLink, FileUpload],
  templateUrl: './my-objects.html',
  styleUrl: './my-objects.css',
})
export class MyObjects {
  objectService = inject(ObjectService);
  sportService = inject(SportService);

  view = signal<'list' | 'create' | 'import'>('list');
  loading = signal(false);

  objects = signal<any[]>([]);
  sports = signal<any[]>([]);

  form = {
    name: '',
    city: '',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    pricePerHour: null as number | null,
    open: '08:00',
    close: '22:00',
    maxNoShows: 3 as number | null,
  };

  resources = signal<any[]>([]);
  draft = { name: '', type: 'open', capacity: null as number | null, equipmentDescription: '' };
  draftSports = signal<string[]>([]);

  createError = signal('');
  createSuccess = signal('');

  importError = signal('');
  importSuccess = signal('');
  parsed = signal<any>(null);

  ngOnInit() {
    this.loadObjects();
    this.sportService.list().subscribe((data) => {
      if (data != null) this.sports.set(data);
    });
  }

  loadObjects() {
    this.loading.set(true);
    this.objectService.myObjects().subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null) this.objects.set(data);
      },
      error: () => this.loading.set(false),
    });
  }

  setView(v: 'list' | 'create' | 'import') {
    this.view.set(v);
    this.createError.set('');
    this.createSuccess.set('');
    this.importError.set('');
    this.importSuccess.set('');
  }

  sportName(id: string) {
    return this.sports().find((s) => s._id === id)?.name || '';
  }

  sportNames(ids: string[]) {
    return (ids || []).map((id) => this.sportName(id)).join(', ');
  }

  typeLabel(type: string) {
    if (type === 'open') return 'Otvoren';
    if (type === 'closed') return 'Zatvoren';
    if (type === 'hall') return 'Hala';
    return type;
  }

  toggleDraftSport(id: string) {
    const cur = this.draftSports();
    this.draftSports.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  addResource() {
    this.createError.set('');
    if (!this.draft.name.trim()) {
      this.createError.set('Teren mora imati naziv.');
      return;
    }
    const cap = Number(this.draft.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      this.createError.set('Kapacitet terena mora biti ceo broj veći od 0.');
      return;
    }
    if (this.draftSports().length === 0) {
      this.createError.set('Izaberite bar jedan sport za teren.');
      return;
    }
    if ((this.draft.equipmentDescription || '').length > 300) {
      this.createError.set('Opis opreme može imati najviše 300 karaktera.');
      return;
    }
    this.resources.set([
      ...this.resources(),
      {
        name: this.draft.name.trim(),
        type: this.draft.type,
        capacity: cap,
        sports: this.draftSports(),
        equipmentDescription: this.draft.equipmentDescription.trim(),
      },
    ]);
    this.draft = { name: '', type: 'open', capacity: null, equipmentDescription: '' };
    this.draftSports.set([]);
  }

  removeResource(i: number) {
    this.resources.set(this.resources().filter((_, idx) => idx !== i));
  }

  submitCreate() {
    this.createError.set('');
    this.createSuccess.set('');
    if (this.resources().length === 0) {
      this.createError.set('Objekat mora imati bar jedan teren.');
      return;
    }
    const payload = {
      name: this.form.name,
      city: this.form.city,
      address: this.form.address,
      location: { lat: Number(this.form.lat), lng: Number(this.form.lng) },
      pricePerHour: Number(this.form.pricePerHour),
      workingHours: { open: this.form.open, close: this.form.close },
      maxNoShows: Number(this.form.maxNoShows),
      resources: this.resources(),
    };
    this.objectService.createObject(payload).subscribe((res) => {
      if (res != null && res.message) {
        this.createSuccess.set(res.message);
        this.resetCreate();
        this.loadObjects();
      } else if (res != null && res.error) {
        this.createError.set(res.error);
      }
    });
  }

  resetCreate() {
    this.form = { name: '', city: '', address: '', lat: null, lng: null, pricePerHour: null, open: '08:00', close: '22:00', maxNoShows: 3 };
    this.resources.set([]);
    this.draft = { name: '', type: 'open', capacity: null, equipmentDescription: '' };
    this.draftSports.set([]);
  }

  onJson(text: string) {
    this.importError.set('');
    this.importSuccess.set('');
    this.parsed.set(null);
    if (!text) return;
    try {
      this.parsed.set(JSON.parse(text));
    } catch {
      this.importError.set('Fajl nije ispravan JSON.');
    }
  }

  submitImport() {
    this.importError.set('');
    this.importSuccess.set('');
    if (this.parsed() == null) {
      this.importError.set('Prvo izaberite ispravan JSON fajl.');
      return;
    }
    this.objectService.importObject(this.parsed()).subscribe((res) => {
      if (res != null && res.message) {
        this.importSuccess.set(res.message);
        this.parsed.set(null);
        this.loadObjects();
      } else if (res != null && res.error) {
        this.importError.set(res.error);
      }
    });
  }

  exampleJson = computed(() => {
    const sid = this.sports()[0]?._id || '<sportId>';
    return JSON.stringify(
      {
        name: 'Novi sportski centar',
        city: 'Beograd',
        address: 'Ulica 1',
        location: { lat: 44.8, lng: 20.46 },
        pricePerHour: 2000,
        workingHours: { open: '08:00', close: '22:00' },
        maxNoShows: 3,
        resources: [{ name: 'Teren 1', type: 'open', capacity: 10, sports: [sid], equipmentDescription: '' }],
      },
      null,
      2,
    );
  });

  statusLabel(s: string) {
    return s === 'approved' ? 'Odobren' : 'Na čekanju';
  }

}
