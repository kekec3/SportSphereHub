import { afterNextRender, Component, computed, ElementRef, inject, Injector, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ObjectService } from '../../services/object.service';
import { RatingService } from '../../services/rating.service';
import * as L from 'leaflet';
import { Calendar } from '../../components/calendar/calendar';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-object-details',
  imports: [RouterLink, Calendar, DatePipe, NgClass, FormsModule],
  templateUrl: './object-details.html',
  styleUrl: './object-details.css',
})
export class ObjectDetails {
  route = inject(ActivatedRoute);
  objectService = inject(ObjectService);
  auth = inject(AuthService);
  injector = inject(Injector);
  ratingService = inject(RatingService);

  mapEl = viewChild<ElementRef>('mapEl');

  obj = signal<any>(null);
  terrains = signal<any[]>([]);
  equipment = signal<any[]>([]);
  promotions = signal<any[]>([]);
  loading = signal(true);

  courtIndex = signal(0);
  selectedTerrain = computed(() => {
    return this.terrains()[this.courtIndex()] || null;
  });
  canBook = computed(() => {
    return this.auth.isLoggedIn() && this.auth.role() === 'sportista';
  });

  map: L.Map | null = null;

  ratings = signal<any>(null);
  ratingLike = signal<boolean | null>(null);
  ratingComment = '';
  ratingError = signal('');


  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.objectService.getById(id).subscribe((data) => {
      this.loading.set(false);
      if (data != null && data.object != null) {
        this.obj.set(data.object);
        this.terrains.set(data.terrains || []);
        this.equipment.set(data.equipment || []);
        this.promotions.set(data.promotions || []);
        this.loadRatings(id);
        afterNextRender(() => this.initMap(), { injector: this.injector });
      }
    });
  }

  loadRatings(id: string) {
    this.ratingService.getForObject(id).subscribe((data) => {
      if (data != null)
        this.ratings.set(data);
    });
  }

  initMap() {
    const obj = this.obj();
    const el = this.mapEl()?.nativeElement;
    if (!obj || !obj.location || !el || this.map)
      return;

    const { lat, lng } = obj.location;
    this.map = L.map(el).setView([lat, lng], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    const pin = L.divIcon({
      className: 'map-pin',
      html: '<div class="map-pin-inner">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 28],
    });
    L.marker([lat, lng], { icon: pin }).addTo(this.map).bindPopup(obj.name);

    setTimeout(() => this.map?.invalidateSize(), 0);
  }

  typeLabel(type: string) {
    if (type === 'open') return 'Otvoreni';
    if (type === 'closed') return 'Zatvoreni';
    if (type === 'hall') return 'Hala';
    return type;
  }

  discountLabel(p: any) {
    return p.discountType === 'percent' ? `-${p.value}%` : `-${p.value} RSD`;
  }

  prevCourt() {
    const n = this.terrains().length;
    if (n)
      this.courtIndex.set((this.courtIndex() + n - 1) % n);
  }

  nextCourt() {
    const n = this.terrains().length;
    if (n)
      this.courtIndex.set((this.courtIndex() + 1) % n);
  }

  onReserved() {
    // reservation succeeded (calendar shows its own confirmation) — hook for future refresh
  }

  setRatingLike(value: boolean) {
    this.ratingLike.set(value);
  }

  submitRating() {
    this.ratingError.set('');
    const id = this.obj()?._id;
    if (!id) return;
    if (this.ratingLike() === null) {
      this.ratingError.set('Izaberite ocenu (👍 ili 👎).');
      return;
    }
    const payload = { objectId: id, like: this.ratingLike()!, comment: this.ratingComment };
    this.ratingService.create(payload).subscribe((res) => {
      if (res != null && res.message) {
        this.ratingComment = '';
        this.ratingLike.set(null);
        this.loadRatings(id);
      } else if (res != null && res.error) {
        this.ratingError.set(res.error);
      }
    });
  }
}
