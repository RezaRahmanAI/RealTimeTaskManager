import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { Subject } from 'rxjs';
import { environment } from '../environments/environment';
import { AuthService } from './auth.service';
import { Task, Comment, Project, Notification } from '../models/model';

@Injectable({ providedIn: 'root' })
export class SignalRService {
  private hubConnection!: HubConnection;
  public taskCreated = new Subject<Task>();
  public taskUpdated = new Subject<{ taskId: number; status: string }>();
  public taskDeleted = new Subject<number>();
  public commentAdded = new Subject<{ taskId: number; comment: Comment }>();
  public projectUpdated = new Subject<Project>();
  public notificationReceived = new Subject<Notification>();

  constructor(private authService: AuthService) {}

  startConnection() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(environment.signalrUrl, {
        accessTokenFactory: () => this.authService.getToken() || '',
      })
      .build();

    this.hubConnection
      .start()
      .then(() => console.log('SignalR connection started'))
      .catch((err) => console.error('Error starting SignalR connection:', err));

    this.hubConnection.on('TaskCreated', (task: Task) =>
      this.taskCreated.next(task)
    );
    this.hubConnection.on(
      'TaskUpdated',
      (update: { taskId: number; status: string }) =>
        this.taskUpdated.next(update)
    );
    this.hubConnection.on('TaskDeleted', (id: number) =>
      this.taskDeleted.next(id)
    );
    this.hubConnection.on('CommentAdded', (taskId: number, comment: Comment) =>
      this.commentAdded.next({ taskId, comment })
    );
    this.hubConnection.on('ProjectUpdated', (project: Project) =>
      this.projectUpdated.next(project)
    );
    this.hubConnection.on('ReceiveNotification', (notification: Notification) =>
      this.notificationReceived.next(notification)
    );
  }

  joinProjectGroup(projectId: number) {
    this.hubConnection
      .invoke('JoinProjectGroup', projectId)
      .catch((err) => console.error('Error joining project group:', err));
  }
}
