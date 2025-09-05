import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CreateTaskDto, TaskItem } from '../models/model';



@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'https://localhost:5001/api/tasks';
  private hubConnection: HubConnection;
  private taskCreatedSubject = new Subject<TaskItem>();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl('https://localhost:5001/taskHub', {
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

    this.hubConnection.on('ReceiveTaskCreated', (task: any) => {
      console.log('Raw SignalR Task:', task);
      const mappedTask: TaskItem = {
        id: task.Id ?? task.id,
        title: task.Title ?? task.title ?? '',
        description: task.Description ?? task.description ?? '',
        status: task.Status ?? task.status ?? 'ToDo',
        createdAt: task.CreatedAt ?? task.createdAt,
        assignedToId: task.AssignedToId ?? task.assignedToId,
      };
      console.log('Mapped SignalR Task:', mappedTask);
      this.taskCreatedSubject.next(mappedTask);
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
    return this.http
      .get<any[]>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        map((tasks) =>
          tasks.map((task) => ({
            id: task.Id,
            title: task.Title ?? '',
            description: task.Description ?? '',
            status: task.Status ?? 'ToDo',
            createdAt: task.CreatedAt,
            assignedToId: task.AssignedToId,
          }))
        )
      );
  }

  createTask(task: CreateTaskDto): Observable<TaskItem> {
    return this.http
      .post<any>(this.apiUrl, task, { headers: this.getHeaders() })
      .pipe(
        map((task) => ({
          id: task.Id,
          title: task.Title ?? '',
          description: task.Description ?? '',
          status: task.Status ?? 'ToDo',
          createdAt: task.CreatedAt,
          assignedToId: task.AssignedToId,
        }))
      );
  }

  getTaskCreated(): Observable<TaskItem> {
    return this.taskCreatedSubject.asObservable();
  }
}
