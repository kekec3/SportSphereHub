import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PromotionService } from '../../services/promotion.service';
import { ObjectService } from '../../services/object.service';
import { SportService } from '../../services/sport.service';

@Component({
  selector: 'app-employee-promotions',
  imports: [FormsModule, DatePipe],
  templateUrl: './employee-promotions.html',
  styleUrl: './employee-promotions.css',
})
export class EmployeePromotions {
  promotionService = inject(PromotionService);
  objectService = inject(ObjectService);
  sportService = inject(SportService);

  loading = signal(false);
  objects = signal<any[]>([]);
  sports = signal<any[]>([]);
  promotions = signal<any[]>([]);

  filterObject = '';
  listMsg = signal('');

  showForm = signal(false);
  editingId = signal<string | null>(null);
  formError = signal('');
  form = {
    name: '',
    objectId: '',
    sport: '',
    discountType: 'percent',
    value: null as number | null,
    validFrom: '',
    validTo: '',
  };

  ngOnInit() {
    this.objectService.myObjects().subscribe((data) => {
      if (data != null)
        this.objects.set(data);
    });
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.promotionService.mine(this.filterObject).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null)
          this.promotions.set(data);
      },
      error: () => this.loading.set(false),
    });
  }

  startCreate() {
    this.editingId.set(null);
    this.formError.set('');
    this.form = { name: '', objectId: '', sport: '', discountType: 'percent', value: null, validFrom: '', validTo: '' };
    this.showForm.set(true);
  }

  startEdit(p: any) {
    this.editingId.set(p._id);
    this.formError.set('');
    this.form = {
      name: p.name,
      objectId: p.objectId?._id || p.objectId,
      sport: p.sport?._id || p.sport,
      discountType: p.discountType,
      value: p.value,
      validFrom: this.toDateInput(p.validFrom),
      validTo: this.toDateInput(p.validTo),
    };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.formError.set('');
  }

  submitForm() {
    this.formError.set('');
    const payload = { ...this.form, value: Number(this.form.value) };
    const req = this.editingId()
      ? this.promotionService.update(this.editingId()!, payload)
      : this.promotionService.create(payload);
    req.subscribe((res) => {
      if (res != null && res.message) {
        this.showForm.set(false);
        this.listMsg.set(res.message);
        this.reload();
      } else if (res != null && res.error) {
        this.formError.set(res.error);
      }
    });
  }

  remove(p: any) {
    if (!confirm(`Obrisati promociju „${p.name}"?`))
      return;
    this.promotionService.remove(p._id).subscribe((res) => {
      if (res != null && res.message) {
        this.listMsg.set(res.message);
        this.reload();
      }
    });
  }

  discountLabel(p: any) {
    return p.discountType === 'percent' ? `${p.value}%` : `${p.value} RSD`;
  }

  toDateInput(value: any) {
    const dt = new Date(value);
    const month = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${dt.getFullYear()}-${month}-${day}`;
  }
}
