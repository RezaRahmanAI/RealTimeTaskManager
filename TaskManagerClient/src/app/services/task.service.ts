import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { TaskItem } from '../models/model';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private apiUrl = environment.baseUrl + '/api/tasks';
  private hubConnection: HubConnection;
  private taskUpdateSubject = new Subject<{ taskId: string; status: string }>();

  constructor(private http: HttpClient) {
    this.hubConnection = new HubConnectionBuilder()
    .withUrl(environment.baseUrl+'/taskHub')
    .build()


    this.hubConnection
      .start()
      .then(() => console.log('SignalR Connected'))
      .catch((err) => console.error('SignalR Connection Error:', err));

    this.hubConnection.on('ReceivedTaskUpdate', (taskId: string, status: string) =>{
      this.taskUpdateSubject.next({taskId, status});
    })
  }

  getTasks(): Observable<TaskItem[]> {
    return this.http.get<TaskItem[]>(this.apiUrl)
  }

  createTask(task: TaskItem): Observable<TaskItem> {
    return this.http.post<TaskItem>(this.apiUrl, task)
  }

  getTaskUpdates(): Observable<{taskId: string, status: string}> {
    return this.taskUpdateSubject.asObservable()
  }

}
