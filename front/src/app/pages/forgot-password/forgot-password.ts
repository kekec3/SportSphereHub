import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  auth = inject(AuthService);

  usernameOrEmail = '';
  loading = signal(false);
  message = signal('');
  error = signal('');
  resetLink = signal('');

  submit() {
    this.message.set('');
    this.error.set('');
    this.resetLink.set('');
    if (!this.usernameOrEmail.trim()) {
      this.error.set('Unesite korisničko ime ili email.');
      return;
    }
    this.loading.set(true);
    this.auth.forgotPassword(this.usernameOrEmail.trim()).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null && data.message)
          this.message.set(data.message);
        if (data != null && data.devLink)
          this.resetLink.set(data.devLink);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Došlo je do greške. Pokušajte ponovo.');
      },
    });
  }

  resetPath() {
    const link = this.resetLink();
    const idx = link.indexOf('/reset-password/');
    return idx >= 0 ? link.slice(idx) : link;
  }
}
