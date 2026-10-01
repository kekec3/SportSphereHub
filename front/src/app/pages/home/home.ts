import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ObjectService } from '../../services/object.service';
import { PromotionService } from '../../services/promotion.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  objectService = inject(ObjectService);
  promotionService = inject(PromotionService);
  auth = inject(AuthService);

  activeCount = signal(0);
  topObjects = signal<any[]>([]);
  promotions = signal<any[]>([]);

  ngOnInit() {
    this.objectService.stats().subscribe((data) => {
      if (data != null) {
        this.activeCount.set(data.activeCount);
        this.topObjects.set(data.topObjects);
      }
    });
    this.promotionService.active(3).subscribe((data) => {
      if (data != null)
        this.promotions.set(data);
    });
  }

  discountLabel(p: any) {
    return p.discountType === 'percent' ? `-${p.value}%` : `-${p.value} RSD`;
  }
}
