import { Component, computed, input, output, signal } from '@angular/core';

export interface Column {
  key: string;
  label: string;
}

@Component({
  selector: 'app-sortable-table',
  imports: [],
  templateUrl: './sortable-table.html',
  styleUrl: './sortable-table.css',
})
export class SortableTable {
  columns = input<Column[]>([]);
  rows = input<any[]>([]);
  clickable = input(false);

  actionLabel = input('');
  action = output<any>();

  rowClick = output<any>();

  sortKey = signal('');
  sortDir = signal<'asc' | 'desc'>('asc');

  sortedRows = computed(() => {
    const key = this.sortKey();
    const data = [...this.rows()];
    if (!key)
      return data;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
      const valA = a[key];
      const valB = b[key];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'number' && typeof valB === 'number')
        return (valA - valB) * dir;
      return String(valA).localeCompare(String(valB), 'sr') * dir;
    });
  });

  sortBy(key: string) {
    if (this.sortKey() === key) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  indicator(key: string) {
    if (this.sortKey() !== key)
      return '';
    return this.sortDir() === 'asc' ? '▲' : '▼';
  }

  onRowClick(row: any) {
    if (this.clickable())
      this.rowClick.emit(row);
  }

  onAction(event: Event, row: any) {
    event.stopPropagation();
    this.action.emit(row);
  }
}
