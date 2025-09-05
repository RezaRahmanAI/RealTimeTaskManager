import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, RegisterModel } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-4 max-w-md">
      <h1 class="text-2xl font-bold mb-4">Register</h1>
      <div *ngIf="errorMessage" class="text-red-500 mb-4">
        {{ errorMessage }}
      </div>
      <form (ngSubmit)="register()">
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
          <label class="block mb-1">Email</label>
          <input
            [(ngModel)]="model.email"
            name="email"
            type="email"
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
            pattern="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$"
          />
          <small
            *ngIf="
              model.password &&
              !model.password.match(
                '^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$'
              )
            "
            class="text-red-500"
          >
            Password must be at least 8 characters, include a letter, number,
            and special character.
          </small>
        </div>
        <button
          type="submit"
          class="bg-blue-500 text-white p-2 rounded"
          [disabled]="!model.username || !model.email || !model.password"
        >
          Register
        </button>
        <p class="mt-2">
          Already have an account?
          <a routerLink="/login" class="text-blue-500">Login</a>
        </p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  model: RegisterModel = { username: '', email: '', password: '' };
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    this.errorMessage = null;
    console.log('Register payload:', this.model);
    this.authService.register(this.model).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.errorMessage =
          err.error?.Errors?.join(', ') ||
          err.error?.Error ||
          'Registration failed';
        console.error('Register error:', err);
      },
    });
  }
}
