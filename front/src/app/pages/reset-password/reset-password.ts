import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  route = inject(ActivatedRoute);
  router = inject(Router);
  auth = inject(AuthService);

  token = '';
  password = '';
  confirm = '';
  loading = signal(false);
  message = signal('');
  error = signal('');

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  submit() {
    this.error.set('');
    this.message.set('');
    if (!this.password || !this.confirm) {
      this.error.set('Popunite oba polja.');
      return;
    }
    if (this.password !== this.confirm) {
      this.error.set('Lozinke se ne poklapaju.');
      return;
    }
    this.loading.set(true);
    this.auth.resetPassword(this.token, this.password).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data != null && data.message) {
          this.message.set(data.message + ' Preusmeravanje na prijavu…');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        } else {
          this.error.set(data?.error || 'Reset nije uspeo.');
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Došlo je do greške. Pokušajte ponovo.');
      },
    });
  }
}
