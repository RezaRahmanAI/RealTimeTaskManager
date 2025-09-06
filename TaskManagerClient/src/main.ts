import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations'; // ✅
import { AppComponent } from './app/app.component';
import { DashboardComponent } from './app/components/dashboard/dashboard.component';
import { LoginComponent } from './app/components/login/login.component';
import { ProfileComponent } from './app/components/profile/profile.component';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { AuthGuard } from './app/services/auth.guard';
import { RegisterComponent } from './app/components/register/register.component';

const routes: Routes = [
  { path: '', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent},
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes),
    provideAnimations(), // ✅ Add this
    AuthGuard,
  ],
}).catch((err) => console.error(err));
