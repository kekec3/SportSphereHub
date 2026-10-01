import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HealthService } from './services/health.service';
import { Header } from './components/header/header';
import { Footer } from './components/footer/footer';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  auth = inject(AuthService);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.auth.me().subscribe({
        next: (user) => {
          if (user != null)
            this.auth.setUser(user);
          error: () => { }
        }
      });
    }
  }
}
