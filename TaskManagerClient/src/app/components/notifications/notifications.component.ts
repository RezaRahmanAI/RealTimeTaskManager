import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatIconModule } from '@angular/material/icon';
import { TaskService } from '../../services/task.service';
import { SignalRService } from '../../services/signalr.service';
import { Notification } from '../../models/model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatIconModule,
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css'],
})
export class NotificationsComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(
    private taskService: TaskService,
    private signalRService: SignalRService
  ) {}

  ngOnInit() {
    this.loadNotifications();
    this.signalRService.notificationReceived.subscribe(
      (notification: Notification) => {
        this.notifications = [...this.notifications, notification];
      }
    );
  }

  loadNotifications() {
    this.taskService.getNotifications().subscribe({
      next: (notifs) => {
        this.notifications = notifs;
      },
      error: (err) => console.error('Error loading notifications:', err),
    });
  }

  markRead(id: number) {
    this.taskService.markNotificationRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter((n) => n.id !== id);
      },
      error: (err) => console.error('Error marking notification as read:', err),
    });
  }
}
