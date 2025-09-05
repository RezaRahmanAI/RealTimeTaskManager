import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CreateTaskDto, TaskItemWithEditing, UpdateTaskDto } from '../models/model';



@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = 'https://localhost:5001/api/tasks';
  private hubConnection: HubConnection;
  private taskCreatedSubject = new Subject<TaskItemWithEditing>();
  private taskUpdatedSubject = new Subject<TaskItemWithEditing>();
  private taskDeletedSubject = new Subject<number>();

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
      const mappedTask: TaskItemWithEditing = {
        id: task.Id ?? task.id,
        title: task.Title ?? task.title ?? '',
        description: task.Description ?? task.description ?? '',
        status: task.Status ?? task.status ?? 'ToDo',
        createdAt: task.CreatedAt ?? task.createdAt,
        assignedToId: task.AssignedToId ?? task.assignedToId,
        isEditing: false,
      };
      console.log('Mapped SignalR Task:', mappedTask);
      this.taskCreatedSubject.next(mappedTask);
    });

    this.hubConnection.on('ReceiveTaskUpdated', (task: any) => {
      console.log('Raw SignalR Task Update:', task);
      const mappedTask: TaskItemWithEditing = {
        id: task.Id ?? task.id,
        title: task.Title ?? task.title ?? '',
        description: task.Description ?? task.description ?? '',
        status: task.Status ?? task.status ?? 'ToDo',
        createdAt: task.CreatedAt ?? task.createdAt,
        assignedToId: task.AssignedToId ?? task.assignedToId,
        isEditing: false,
      };
      console.log('Mapped SignalR Task Update:', mappedTask);
      this.taskUpdatedSubject.next(mappedTask);
    });

    this.hubConnection.on('ReceiveTaskDeleted', (taskId: number) => {
      console.log('SignalR Task Deleted:', taskId);
      this.taskDeletedSubject.next(taskId);
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

  getTasks(): Observable<TaskItemWithEditing[]> {
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
            isEditing: false,
          }))
        )
      );
  }

  createTask(task: CreateTaskDto): Observable<TaskItemWithEditing> {
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
          isEditing: false,
        }))
      );
  }

  updateTask(
    id: number,
    taskDto: UpdateTaskDto
  ): Observable<TaskItemWithEditing> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, taskDto, { headers: this.getHeaders() })
      .pipe(
        map((task) => ({
          id: task.Id,
          title: task.Title ?? '',
          description: task.Description ?? '',
          status: task.Status ?? 'ToDo',
          createdAt: task.CreatedAt,
          assignedToId: task.AssignedToId,
          isEditing: false,
        }))
      );
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders(),
    });
  }

  getTaskCreated(): Observable<TaskItemWithEditing> {
    return this.taskCreatedSubject.asObservable();
  }

  getTaskUpdated(): Observable<TaskItemWithEditing> {
    return this.taskUpdatedSubject.asObservable();
  }

  getTaskDeleted(): Observable<number> {
    return this.taskDeletedSubject.asObservable();
  }
}
