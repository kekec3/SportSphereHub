import { DatePipe, NgClass } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EquipmentService } from '../../services/equipment.service';
import { OrderService } from '../../services/order.service';
import { SportService } from '../../services/sport.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-shop',
  imports: [FormsModule, DatePipe, NgClass],
  templateUrl: './shop.html',
  styleUrl: './shop.css',
})
export class Shop {
  equipmentService = inject(EquipmentService);
  orderService = inject(OrderService);
  sportService = inject(SportService);
  objectService = inject(ObjectService);

  tab = signal<'catalog' | 'orders'>('catalog');

  equipment = signal<any[]>([]);
  sports = signal<any[]>([]);
  objects = signal<any[]>([]);
  orders = signal<any[]>([]);
  loading = signal(false);

  filterSport = '';
  filterObject = '';

  cart = signal<any[]>([]);
  orderError = signal('');
  orderSuccess = signal('');

  cartTotal = computed(() =>
    this.cart().reduce((sum, item) => sum + item.equipment.price * item.quantity, 0),
  );

  ngOnInit() {
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
    this.objectService.listApproved().subscribe((data) => {
      if (data != null)
        this.objects.set(data);
    });
    this.loadEquipment();
    this.loadOrders();
  }

  setTab(tab: 'catalog' | 'orders') {
    this.tab.set(tab);
    if (tab === 'catalog') this.loadEquipment();
    else this.loadOrders();
  }

  loadEquipment() {
    this.loading.set(true);
    this.equipmentService.list(this.filterSport, this.filterObject).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null)
          this.equipment.set(data);
      },
      error: () => this.loading.set(false),
    });
  }

  loadOrders() {
    this.orderService.mine().subscribe((data) => {
      if (data != null)
        this.orders.set(data);
    });
  }

  resetFilters() {
    this.filterSport = '';
    this.filterObject = '';
    this.loadEquipment();
  }

  addToCart(e: any) {
    this.orderSuccess.set('');
    const existing = this.cart().find((i) => i.equipment._id === e._id);
    if (existing) {
      if (existing.quantity < e.stock)
        this.cart.set(this.cart().map((i) => (i === existing ? { ...i, quantity: i.quantity + 1 } : i)));
    } else {
      this.cart.set([...this.cart(), { equipment: e, quantity: 1 }]);
    }
  }

  incQty(item: any) {
    if (item.quantity < item.equipment.stock)
      this.cart.set(this.cart().map((i) => (i === item ? { ...i, quantity: i.quantity + 1 } : i)));
  }

  decQty(item: any) {
    if (item.quantity > 1) {
      this.cart.set(this.cart().map((i) => (i === item ? { ...i, quantity: i.quantity - 1 } : i)));
    } else {
      this.removeFromCart(item);
    }
  }

  removeFromCart(item: any) {
    this.cart.set(this.cart().filter((i) => i !== item));
  }

  placeOrder() {
    this.orderError.set('');
    this.orderSuccess.set('');
    if (this.cart().length === 0) return;

    const items = this.cart().map((i) => ({ equipmentId: i.equipment._id, quantity: i.quantity }));
    this.orderService.create(items).subscribe((res) => {
      if (res != null && res.message) {
        this.orderSuccess.set('Porudžbina je uspešno kreirana.');
        this.cart.set([]);
        this.loadEquipment();
        this.loadOrders();
      } else if (res != null && res.error) {
        this.orderError.set(res.error);
      }
    });
  }

  cancelOrder(o: any) {
    if (!confirm('Otkazati porudžbinu?'))
      return;
    this.orderService.cancel(o._id).subscribe((res) => {
      if (res != null && res.message) {
        this.loadOrders();
        this.loadEquipment();
      } else if (res != null && res.error) {
        alert(res.error);
      }
    });
  }

  orderStatusLabel(status: string) {
    if (status === 'ordered') return 'Poručeno';
    if (status === 'picked-up') return 'Preuzeto';
    if (status === 'cancelled') return 'Otkazano';
    return status;
  }

}
