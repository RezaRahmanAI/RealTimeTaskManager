import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../environments/environment';

export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  assignedToId?: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = environment.baseUrl+'/api/tasks';
  private hubConnection: HubConnection;
  private taskCreatedSubject = new Subject<TaskItem>();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.baseUrl + '/taskHub', {
        accessTokenFactory: () => {
          const token = this.authService.getToken();
          console.log('SignalR Token:', token);
          return token || '';
        },
      })
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Error:', err));

    this.hubConnection.on('ReceiveTaskCreated', (task: TaskItem) => {
      this.taskCreatedSubject.next(task);
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    console.log('HTTP Token:', token);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }

  getTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(this.apiUrl, {
      headers: this.getHeaders(),
    });
  }

  createTask(task: CreateTaskDto): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, task, {
      headers: this.getHeaders(),
    });
  }

  getTaskCreated(): Observable<TaskItem> {
    return this.taskCreatedSubject.asObservable();
  }
}
