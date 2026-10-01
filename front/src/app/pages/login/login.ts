import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms'
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  auth = inject(AuthService);
  router = inject(Router);

  username = '';
  password = '';
  error = signal('');
  loading = signal(false);

  submit() {
    this.error.set('');
    if (!this.username || !this.password) {
      this.error.set('Unesite korisničko ime i lozinku.');
      return;
    }
    this.loading.set(true);
    this.auth.login(this.username, this.password).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null && data.token) {
          this.auth.setSession(data);
          this.router.navigate([this.auth.homePath()]);
        } else {
          this.error.set(data?.error || 'Neuspešna prijava.');
        }
      }
    });
  }
}
