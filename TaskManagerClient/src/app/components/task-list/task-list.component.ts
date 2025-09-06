import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css'],
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() editTask = new EventEmitter<Task>();
  newComment: { [taskId: number]: string } = {};

  constructor(private taskService: TaskService) {}

  deleteTask(id: number) {
    this.taskService.deleteTask(id).subscribe({
      error: (err) => console.error('Error deleting task:', err),
    });
  }

  addComment(taskId: number) {
    if (this.newComment[taskId]) {
      this.taskService
        .addComment(taskId, { content: this.newComment[taskId] })
        .subscribe({
          next: () => {
            this.newComment[taskId] = '';
          },
          error: (err) => console.error('Error adding comment:', err),
        });
    }
  }

  uploadFile(taskId: number, event: any) {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.taskService.uploadAttachment(taskId, formData).subscribe({
        error: (err) => console.error('Error uploading attachment:', err),
      });
    }
  }
}
