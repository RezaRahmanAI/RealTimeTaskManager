import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  profile = { userName: '', email: '' };
  error: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.authService.getProfile().subscribe({
      next: (data) => (this.profile = data),
      error: (err) =>
        (this.error = err.error?.error || 'Failed to load profile'),
    });
  }

  onSubmit() {
    this.authService.updateProfile(this.profile).subscribe({
      next: () => console.log('Profile updated'),
      error: (err) =>
        (this.error = err.error?.errors?.join(', ') || 'Update failed'),
    });
  }
}
