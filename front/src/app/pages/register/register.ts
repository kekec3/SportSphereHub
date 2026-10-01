import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FileUpload } from '../../components/file-upload/file-upload';
import { AvatarGenerator } from '../../components/avatar-generator/avatar-generator';
import { AuthService } from '../../services/auth.service';
import { SportService } from '../../services/sport.service';
import { ObjectService } from '../../services/object.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, FileUpload, AvatarGenerator],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  auth = inject(AuthService);
  sportService = inject(SportService);
  objectService = inject(ObjectService);
  router = inject(Router);

  role = 'sportista';
  username = '';
  email = '';
  firstName = '';
  lastName = '';
  phone = '';
  password = '';
  maticniBroj = '';
  pib = '';
  objectId = '';

  favoriteSports = signal<string[]>([]);
  avatar = signal('');
  avatarMode = signal<'upload' | 'generate'>('generate');

  sports = signal<any[]>([]);
  objects = signal<any[]>([]);

  error = signal('');
  success = signal('');
  loading = signal(false);

  ngOnInit() {
    this.sportService.list().subscribe((data) => {
      if (data != null)
        this.sports.set(data);
    });
    this.objectService.listApproved().subscribe((data) => {
      if (data != null)
        this.objects.set(data);
    });
  }

  toggleSport(id: string) {
    const current = this.favoriteSports();
    if (current.includes(id)) {
      this.favoriteSports.set(current.filter((s) => s !== id));
    } else if (current.length < 5) {
      this.favoriteSports.set([...current, id]);
    }
  }

  isSelected(id: string) {
    return this.favoriteSports().includes(id);
  }

  onAvatar(base64: string) {
    this.avatar.set(base64);
  }

  submit() {
    this.error.set('');
    this.success.set('');

    const payload: any = {
      role: this.role,
      username: this.username,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      password: this.password,
      favoriteSports: this.favoriteSports(),
    };
    if (this.avatar())
      payload.avatar = this.avatar();
    if (this.role === 'zaposleni') {
      payload.objectId = this.objectId;
      payload.maticniBroj = this.maticniBroj;
      payload.pib = this.pib;
    }

    this.loading.set(true);
    this.auth.register(payload).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null && data.message) {
          this.success.set(data.message);
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          this.error.set(data?.error || 'Registarcija nije uspela.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Greška pri povezivanju sa serverom.');
      },
    });
  }
}
