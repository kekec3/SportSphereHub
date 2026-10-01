import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-file-upload',
  imports: [],
  templateUrl: './file-upload.html',
  styleUrl: './file-upload.css',
})
export class FileUpload {
  label = input('Izaberite fajl');
  accept = input('image/*');
  preview = input(true);
  mode = input<'dataurl' | 'text'>('dataurl');

  fileSelected = output<string>();

  dataUrl = signal<string | null>(null);
  fileName = signal('');

  showImage() {
    return this.preview() && this.mode() === 'dataurl' && this.dataUrl();
  }

  onFile(event: Event) {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (!file)
      return;
    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.dataUrl.set(result);
      this.fileSelected.emit(result);
    };
    if (this.mode() === 'text')
      reader.readAsText(file);
    else
      reader.readAsDataURL(file);
  }

  clear() {
    this.dataUrl.set(null);
    this.fileName.set('');
    this.fileSelected.emit('');
  }
}
