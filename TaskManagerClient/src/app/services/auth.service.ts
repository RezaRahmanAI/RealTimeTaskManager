import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../environments/environment';

export interface RegisterModel {
  username: string;
  email: string;
  password: string;
}

export interface LoginModel {
  username: string;
  password: string;
}

export interface DecodedToken {
  sub: string;
  nameid: string;
  exp: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.baseUrl+'/api/auth';
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('token')
  );
  private userSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    const token = this.tokenSubject.value;
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        this.userSubject.next(decoded.sub);
      } catch (err) {
        console.error('Token decode error:', err);
        this.logout();
      }
    }
  }

  register(model: RegisterModel): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, model);
  }

  login(model: LoginModel): Observable<any> {
    return this.http
      .post<{ Token: string }>(`${this.apiUrl}/login`, model)
      .pipe(
        tap({
          next: (response) => {
            const token = response.Token; // Use uppercase Token
            console.log('Login token:', token);
            if (!token) {
              throw new Error('No token received from server');
            }
            localStorage.setItem('token', token);
            const decoded = jwtDecode<DecodedToken>(token);
            this.tokenSubject.next(token);
            this.userSubject.next(decoded.sub);
          },
          error: (err) => {
            console.error('Login request error:', err);
          },
        })
      );
  }

  logout() {
    localStorage.removeItem('token');
    this.tokenSubject.next(null);
    this.userSubject.next(null);
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getUser(): Observable<string | null> {
    return this.userSubject.asObservable();
  }
}
