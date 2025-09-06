import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../environments/environment';

interface RegisterModel {
  username: string;
  email: string;
  password: string;
}

interface LoginModel {
  username: string;
  password: string;
}

interface LoginResponse {
  token: string;
  Token?: string; // Handle case sensitivity from API
}

interface Profile {
  userName: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  register(user: RegisterModel): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(credentials: LoginModel): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((res) =>
          localStorage.setItem('token', res.token || res.Token || '')
        )
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getProfile(): Observable<Profile> {
    return this.http.get<Profile>(`${environment.apiUrl}/users/profile`);
  }

  updateProfile(
    profile: Partial<Profile> & { password?: string }
  ): Observable<any> {
    return this.http.put(`${environment.apiUrl}/users/profile`, profile);
  }
}
