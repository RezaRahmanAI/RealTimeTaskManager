import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, LoginModel } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-4 max-w-md">
      <h1 class="text-2xl font-bold mb-4">Login</h1>
      <div *ngIf="errorMessage" class="text-red-500 mb-4">
        {{ errorMessage }}
      </div>
      <form (ngSubmit)="login()">
        <div class="mb-4">
          <label class="block mb-1">Username</label>
          <input
            [(ngModel)]="model.username"
            name="username"
            class="border p-2 w-full"
            required
          />
        </div>
        <div class="mb-4">
          <label class="block mb-1">Password</label>
          <input
            [(ngModel)]="model.password"
            name="password"
            type="password"
            class="border p-2 w-full"
            required
          />
        </div>
        <button
          type="submit"
          class="bg-blue-500 text-white p-2 rounded"
          [disabled]="!model.username || !model.password"
        >
          Login
        </button>
        <p class="mt-2">
          Don't have an account?
          <a routerLink="/register" class="text-blue-500">Register</a>
        </p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  model: LoginModel = { username: '', password: '' };
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.errorMessage = null;
    this.authService.login(this.model).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => {
        this.errorMessage = err.error?.Error || 'Login failed';
        console.error('Login error:', err);
      },
    });
  }
}
