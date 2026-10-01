import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ObjectService } from '../../services/object.service';
import { SportService } from '../../services/sport.service';

@Component({
  selector: 'app-object-manage',
  imports: [FormsModule, RouterLink],
  templateUrl: './object-manage.html',
  styleUrl: './object-manage.css',
})
export class ObjectManage {
  route = inject(ActivatedRoute);
  objectService = inject(ObjectService);
  sportService = inject(SportService);

  id = '';
  loading = signal(true);
  notFound = signal(false);

  object = signal<any>(null);
  terrains = signal<any[]>([]);
  sports = signal<any[]>([]);

  form = {
    name: '',
    city: '',
    address: '',
    lat: null as number | null,
    lng: null as number | null,
    pricePerHour: null as number | null,
    open: '',
    close: '',
    maxNoShows: null as number | null,
  };
  objError = signal('');
  objSuccess = signal('');

  draft = { name: '', type: 'open', capacity: null as number | null, equipmentDescription: '' };
  draftSports = signal<string[]>([]);
  addError = signal('');
  addSuccess = signal('');

  editingId = signal<string | null>(null);
  edit = { name: '', type: 'open', capacity: null as number | null, equipmentDescription: '' };
  editSports = signal<string[]>([]);
  editError = signal('');

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.sportService.list().subscribe((data) => {
      if (data != null) this.sports.set(data);
    });
    this.load();
  }

  load() {
    this.loading.set(true);
    this.objectService.getOwned(this.id).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data == null || data.object == null) {
          this.notFound.set(true);
          return;
        }
        const o = data.object;
        this.object.set(o);
        this.terrains.set(data.terrains || []);
        this.form = {
          name: o.name,
          city: o.city,
          address: o.address,
          lat: o.location?.lat ?? null,
          lng: o.location?.lng ?? null,
          pricePerHour: o.pricePerHour,
          open: o.workingHours?.open ?? '',
          close: o.workingHours?.close ?? '',
          maxNoShows: o.maxNoShows,
        };
      },
      error: () => {
        this.loading.set(false);
        this.notFound.set(true);
      },
    });
  }

  typeLabel(type: string) {
    if (type === 'open') return 'Otvoren';
    if (type === 'closed') return 'Zatvoren';
    if (type === 'hall') return 'Hala';
    return type;
  }

  terrainSports(t: any) {
    return (t.sports || []).map((s: any) => s.name).join(', ');
  }

  toggleDraftSport(id: string) {
    const cur = this.draftSports();
    this.draftSports.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  toggleEditSport(id: string) {
    const cur = this.editSports();
    this.editSports.set(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }

  saveObject() {
    this.objError.set('');
    this.objSuccess.set('');
    const payload = {
      name: this.form.name,
      city: this.form.city,
      address: this.form.address,
      location: { lat: Number(this.form.lat), lng: Number(this.form.lng) },
      pricePerHour: Number(this.form.pricePerHour),
      workingHours: { open: this.form.open, close: this.form.close },
      maxNoShows: Number(this.form.maxNoShows),
    };
    this.objectService.updateObject(this.id, payload).subscribe((res) => {
      if (res != null && res.message) {
        this.objSuccess.set(res.message);
        this.load();
      } else if (res != null && res.error) {
        this.objError.set(res.error);
      }
    });
  }

  addResource() {
    this.addError.set('');
    this.addSuccess.set('');
    if (!this.draft.name.trim()) {
      this.addError.set('Teren mora imati naziv.');
      return;
    }
    const cap = Number(this.draft.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      this.addError.set('Kapacitet terena mora biti ceo broj veći od 0.');
      return;
    }
    if (this.draftSports().length === 0) {
      this.addError.set('Izaberite bar jedan sport za teren.');
      return;
    }
    const resource = {
      name: this.draft.name.trim(),
      type: this.draft.type,
      capacity: cap,
      sports: this.draftSports(),
      equipmentDescription: this.draft.equipmentDescription.trim(),
    };
    this.objectService.addResource(this.id, resource).subscribe((res) => {
      if (res != null && res.message) {
        this.addSuccess.set(res.message);
        this.draft = { name: '', type: 'open', capacity: null, equipmentDescription: '' };
        this.draftSports.set([]);
        this.load();
      } else if (res != null && res.error) {
        this.addError.set(res.error);
      }
    });
  }

  startEdit(t: any) {
    this.editError.set('');
    this.editingId.set(t._id);
    this.edit = {
      name: t.name,
      type: t.type,
      capacity: t.capacity,
      equipmentDescription: t.equipmentDescription || '',
    };
    this.editSports.set((t.sports || []).map((s: any) => s._id));
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editError.set('');
  }

  saveEdit() {
    this.editError.set('');
    const cap = Number(this.edit.capacity);
    if (!this.edit.name.trim() || !Number.isInteger(cap) || cap < 1 || this.editSports().length === 0) {
      this.editError.set('Proverite naziv, kapacitet i bar jedan sport.');
      return;
    }
    const resource = {
      name: this.edit.name.trim(),
      type: this.edit.type,
      capacity: cap,
      sports: this.editSports(),
      equipmentDescription: this.edit.equipmentDescription.trim(),
    };
    this.objectService.updateResource(this.id, this.editingId()!, resource).subscribe((res) => {
      if (res != null && res.message) {
        this.editingId.set(null);
        this.load();
      } else if (res != null && res.error) {
        this.editError.set(res.error);
      }
    });
  }

  removeResource(t: any) {
    if (!confirm(`Obrisati teren „${t.name}"?`)) return;
    this.objectService.deleteResource(this.id, t._id).subscribe((res) => {
      if (res != null && res.message) {
        this.load();
      } else if (res != null && res.error) {
        this.editError.set(res.error);
      }
    });
  }

}
