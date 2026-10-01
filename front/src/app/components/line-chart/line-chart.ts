import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-line-chart',
  imports: [],
  templateUrl: './line-chart.html',
  styleUrl: './line-chart.css',
})
export class LineChart {
  data = input<{ label: string; value: number }[]>([]);
  color = input('var(--color-primary)');

  width = 640;
  height = 280;
  padL = 40;
  padR = 20;
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

  points = computed(() => {
    const data = this.data();
    const max = this.max();
    const n = data.length;
    const stepX = n > 1 ? this.innerW() / (n - 1) : 0;
    return data.map((item, i) => {
      const px = n > 1 ? this.padL + stepX * i : this.padL + this.innerW() / 2;
      const py = this.padT + this.innerH() - (item.value / max) * this.innerH();
      return { label: item.label, value: item.value, px, py, labelY: this.baseY + 18 };
    });
  });

  line = computed(() => this.points().map((p) => `${p.px},${p.py}`).join(' '));

  area = computed(() => {
    const pts = this.points();
    if (pts.length === 0)
      return '';
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    const top = pts.map((p) => `L ${p.px} ${p.py}`).join(' ');
    return `M ${first.px} ${this.baseY} ${top} L ${last.px} ${this.baseY} Z`;
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
