import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  user$: Observable<string | null> | null = null; 

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.user$ = this.authService.getUser();
    this.user$.subscribe((user) => console.log('Current user:', user));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
