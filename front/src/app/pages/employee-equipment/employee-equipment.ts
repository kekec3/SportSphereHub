import { DatePipe, NgClass } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EquipmentService } from '../../services/equipment.service';
import { OrderService } from '../../services/order.service';
import { ObjectService } from '../../services/object.service';
import { SportService } from '../../services/sport.service';
import { FileUpload } from '../../components/file-upload/file-upload';

@Component({
  selector: 'app-employee-equipment',
  imports: [FormsModule, DatePipe, NgClass, FileUpload],
  templateUrl: './employee-equipment.html',
  styleUrl: './employee-equipment.css',
})
export class EmployeeEquipment {
  equipmentService = inject(EquipmentService);
  orderService = inject(OrderService);
  objectService = inject(ObjectService);
  sportService = inject(SportService);

  tab = signal<'catalog' | 'orders'>('catalog');
  loading = signal(false);

  objects = signal<any[]>([]);
  sports = signal<any[]>([]);
  equipment = signal<any[]>([]);
  orders = signal<any[]>([]);

  filterObject = '';
  listMsg = signal('');
  orderMsg = signal('');

  showForm = signal(false);
  editingId = signal<string | null>(null);
  formError = signal('');
  form = {
    name: '',
    objectId: '',
    sport: '',
    price: null as number | null,
    stock: null as number | null,
    image: '',
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

  setTab(t: 'catalog' | 'orders') {
    this.tab.set(t);
    this.listMsg.set('');
    this.orderMsg.set('');
    this.reload();
  }

  reload() {
    this.loading.set(true);
    if (this.tab() === 'catalog') {
      this.equipmentService.mine(this.filterObject).subscribe({
        next: (data) => {
          this.loading.set(false);
          if (data != null)
            this.equipment.set(data);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.orderService.ownerList().subscribe({
        next: (data) => {
          this.loading.set(false);
          if (data != null)
            this.orders.set(data);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  startCreate() {
    this.editingId.set(null);
    this.formError.set('');
    this.form = { name: '', objectId: '', sport: '', price: null, stock: null, image: '' };
    this.showForm.set(true);
  }

  startEdit(e: any) {
    this.editingId.set(e._id);
    this.formError.set('');
    this.form = {
      name: e.name,
      objectId: e.objectId?._id || e.objectId,
      sport: e.sport?._id || e.sport,
      price: e.price,
      stock: e.stock,
      image: e.image || '',
    };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.formError.set('');
  }

  onImage(dataUrl: string) {
    this.form.image = dataUrl || '';
  }

  clearImage() {
    this.form.image = '';
  }

  submitForm() {
    this.formError.set('');
    const payload = { ...this.form, price: Number(this.form.price), stock: Number(this.form.stock) };
    const req = this.editingId()
      ? this.equipmentService.update(this.editingId()!, payload)
      : this.equipmentService.create(payload);
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

  remove(e: any) {
    if (!confirm(`Obrisati opremu „${e.name}"?`))
      return;
    this.equipmentService.remove(e._id).subscribe((res) => {
      if (res != null && res.message) {
        this.listMsg.set(res.message);
        this.reload();
      }
    });
  }

  pickup(o: any) {
    this.orderMsg.set('');
    this.orderService.pickup(o._id).subscribe((res) => {
      if (res != null && res.message) {
        this.orderMsg.set(res.message);
        this.reload();
      } else if (res != null && res.error) {
        this.orderMsg.set(res.error);
      }
    });
  }

  decline(o: any) {
    if (!confirm('Otkazati porudžbinu?'))
      return;
    this.orderMsg.set('');
    this.orderService.decline(o._id).subscribe((res) => {
      if (res != null && res.message) {
        this.orderMsg.set(res.message);
        this.reload();
      } else if (res != null && res.error) {
        this.orderMsg.set(res.error);
      }
    });
  }

  orderStatusLabel(s: string) {
    if (s === 'ordered') return 'Poručeno';
    if (s === 'picked-up') return 'Preuzeto';
    if (s === 'cancelled') return 'Otkazano';
    return s;
  }

  orderStatusClass(s: string) {
    if (s === 'ordered') return 'badge-ordered';
    if (s === 'picked-up') return 'badge-pickedup';
    if (s === 'cancelled') return 'badge-cancelled';
    return '';
  }
}
