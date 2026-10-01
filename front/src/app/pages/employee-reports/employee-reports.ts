import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ObjectService } from '../../services/object.service';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-employee-reports',
  imports: [FormsModule],
  templateUrl: './employee-reports.html',
  styleUrl: './employee-reports.css',
})
export class EmployeeReports {
  objectService = inject(ObjectService);
  reportService = inject(ReportService);

  objects = signal<any[]>([]);
  selectedObjectId = '';
  month = this.currentMonth();

  loadingOccupancy = signal(false);
  loadingTurnover = signal(false);
  error = signal('');

  ngOnInit() {
    this.objectService.myObjects().subscribe((data) => {
      if (data != null)
        this.objects.set(data);
    });
  }

  currentMonth() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }

  canDownload() {
    return !!this.selectedObjectId && !!this.month;
  }

  downloadOccupancy() {
    this.error.set('');
    this.loadingOccupancy.set(true);
    this.reportService.occupancy(this.selectedObjectId, this.month).subscribe({
      next: (blob) => {
        this.loadingOccupancy.set(false);
        this.saveBlob(blob, `popunjenost-${this.month}.pdf`);
      },
      error: () => {
        this.loadingOccupancy.set(false);
        this.error.set('Preuzimanje izveštaja nije uspelo.');
      },
    });
  }

  downloadTurnover() {
    this.error.set('');
    this.loadingTurnover.set(true);
    this.reportService.turnover(this.selectedObjectId, this.month).subscribe({
      next: (blob) => {
        this.loadingTurnover.set(false);
        this.saveBlob(blob, `obrt-opreme-${this.month}.pdf`);
      },
      error: () => {
        this.loadingTurnover.set(false);
        this.error.set('Preuzimanje izveštaja nije uspelo.');
      },
    });
  }

  saveBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
