import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import {
  Task,
  Project,
  Comment,
  Attachment,
  Notification,
} from '../models/model';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;
  private usersUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getTasks(filters: any = {}): Observable<Task[]> {
    let params = new HttpParams();
    if (filters.projectId) params = params.set('projectId', filters.projectId);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.priority) params = params.set('priority', filters.priority);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  createTask(task: Partial<Task>): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: number, task: Partial<Task>): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${environment.apiUrl}/projects`);
  }

  createProject(project: {
    name: string;
    description?: string;
  }): Observable<Project> {
    return this.http.post<Project>(`${environment.apiUrl}/projects`, project);
  }

  joinProject(projectId: number): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/projects/${projectId}/join`,
      {}
    );
  }

  addMember(projectId: number, username: string): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/projects/${projectId}/members`,
      { username }
    );
  }

  addComment(
    taskId: number,
    comment: { content: string }
  ): Observable<Comment> {
    return this.http.post<Comment>(
      `${this.apiUrl}/${taskId}/comments`,
      comment
    );
  }

  uploadAttachment(taskId: number, formData: FormData): Observable<Attachment> {
    return this.http.post<Attachment>(
      `${this.apiUrl}/${taskId}/attachments`,
      formData
    );
  }

  getNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.usersUrl}/notifications`);
  }

  markNotificationRead(id: number): Observable<void> {
    return this.http.put<void>(`${this.usersUrl}/notifications/${id}/read`, {});
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.usersUrl}/search`, {
      params: { query },
    });
  }
}
