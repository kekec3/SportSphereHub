import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'app-avatar-generator',
  imports: [],
  templateUrl: './avatar-generator.html',
  styleUrl: './avatar-generator.css',
})
export class AvatarGenerator {
  avatarSelected = output<string>();

  styles = ['thumbs', 'bottts', 'avataaars', 'fun-emoji', 'croodles-neutral'];
  style = signal('thumbs');
  seed = signal('sportsphere');
  saving = signal(false);

  previewUrl() {
    return `https://api.dicebear.com/9.x/${this.style()}/svg?seed=${encodeURIComponent(this.seed())}`;
  }

  setStyle(s: string) {
    this.style.set(s);
  }

  randomize() {
    this.seed.set(Math.random().toString(36).slice(2, 10));
  }

  save() {
    this.saving.set(true);
    const pngUrl = `https://api.dicebear.com/9.x/${this.style()}/png?seed=${encodeURIComponent(this.seed())}`;
    fetch(pngUrl).then((r) => {
      return r.blob()
    }).then((blob) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.saving.set(false);
        this.avatarSelected.emit(reader.result as string);
      };
      reader.readAsDataURL(blob);
    }).catch(() => {
      this.saving.set(false);
    });
  }
}
