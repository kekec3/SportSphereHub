import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-bar-chart',
  imports: [],
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css',
})
export class BarChart {
  data = input<{ label: string; value: number }[]>([]);
  color = input('var(--color-primary)');

  width = 560;
  height = 280;
  padL = 40;
  padR = 16;
  padT = 20;
  padB = 46;

  private innerW() {
    return this.width - this.padL - this.padR;
  }

  private innerH() {
    return this.height - this.padT - this.padB;
  }

  get baseY() {
    return this.padT + this.innerH();
  }

  max = computed(() => Math.max(1, ...this.data().map((item) => item.value)));

  bars = computed(() => {
    const data = this.data();
    const max = this.max();
    const n = data.length || 1;
    const slot = this.innerW() / n;
    const bw = Math.min(56, slot * 0.55);
    return data.map((item, i) => {
      const h = (item.value / max) * this.innerH();
      const cx = this.padL + slot * i + slot / 2;
      return {
        label: item.label,
        value: item.value,
        x: cx - bw / 2,
        y: this.padT + this.innerH() - h,
        w: bw,
        h,
        cx,
        valueY: this.padT + this.innerH() - h - 8,
        labelY: this.baseY + 18,
      };
    });
  });

  gridLines = computed(() => {
    const max = this.max();
    const ticks = 4;
    const lines: { y: number; value: number; x2: number }[] = [];
    for (let i = 0; i <= ticks; i++) {
      const value = Math.round((max / ticks) * i);
      const y = this.padT + this.innerH() - (this.innerH() / ticks) * i;
      lines.push({ y, value, x2: this.width - this.padR });
    }
    return lines;
  });

}
