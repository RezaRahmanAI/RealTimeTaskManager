import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Observable, Subject, take } from 'rxjs';
import { TaskItem } from '../models/model';
import { environment } from '../environments/environment';


export interface CreateTaskDto {
  title: string;
  description: string;
  status?: string; // Optional, defaults to "ToDo" in backend
  assignedToId?: number; // Optional
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = environment.baseUrl+'/api/tasks';
  private hubConnection: HubConnection;
  private taskCreateSubject = new Subject<TaskItem>()
  private taskUpdateSubject = new Subject<{ taskId: string; status: string }>();

  constructor(private http: HttpClient) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.baseUrl + '/taskHub')
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));

    this.hubConnection.on(
      'ReceiveTaskUpdate',
      (taskId: string, status: string) => {
        this.taskUpdateSubject.next({ taskId, status });
      }
    );

    this.hubConnection.on('ReceiveTaskCreated', (task: TaskItem) => {
      this.taskCreateSubject.next(task)
    });
  }

  getTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(this.apiUrl);
  }

  createTask(task: CreateTaskDto): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, task);
  }

  getTaskUpdates(): Observable<{ taskId: string; status: string }> {
    return this.taskUpdateSubject.asObservable();
  }

  getTaskCreated(): Observable<TaskItem> {
    return this.taskCreateSubject.asObservable();
  }
}
