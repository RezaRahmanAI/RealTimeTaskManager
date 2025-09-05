import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Router } from '@angular/router';
import { CreateTaskDto, TaskItemWithEditing, UpdateTaskDto } from '../../models/model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Task List</h1>
      <div *ngIf="errorMessage" class="text-red-500 mb-4">
        {{ errorMessage }}
      </div>
      <div class="mb-4">
        <input
          [(ngModel)]="newTask.title"
          placeholder="Task Title"
          class="border p-2 mr-2"
        />
        <input
          [(ngModel)]="newTask.description"
          placeholder="Description"
          class="border p-2 mr-2"
        />
        <button
          (click)="createTask()"
          class="bg-blue-500 text-white p-2 rounded"
        >
          Add Task
        </button>
      </div>
      <ul>
        <li
          *ngFor="let task of tasks"
          class="border p-2 mb-2 flex justify-between items-center"
        >
          <div class="flex-1">
            <div *ngIf="!task.isEditing; else editMode">
              <span
                >{{ task.title || 'No Title' }} -
                {{ task.description || 'No Description' }} ({{
                  task.status || 'No Status'
                }})</span
              >
            </div>
            <ng-template #editMode>
              <input
                [(ngModel)]="task.title"
                placeholder="Task Title"
                class="border p-2 mr-2 w-1/3"
              />
              <input
                [(ngModel)]="task.description"
                placeholder="Description"
                class="border p-2 mr-2 w-1/3"
              />
            </ng-template>
          </div>
          <div class="flex items-center">
            <select
              [(ngModel)]="task.status"
              (change)="updateTask(task)"
              class="mr-2"
            >
              <option value="ToDo">ToDo</option>
              <option value="InProgress">InProgress</option>
              <option value="Done">Done</option>
            </select>
            <button
              *ngIf="!task.isEditing"
              (click)="task.isEditing = true"
              class="bg-yellow-500 text-white p-2 mr-2 rounded"
            >
              Edit
            </button>
            <button
              *ngIf="task.isEditing"
              (click)="updateTask(task)"
              class="bg-green-500 text-white p-2 mr-2 rounded"
            >
              Save
            </button>
            <button
              *ngIf="task.isEditing"
              (click)="task.isEditing = false"
              class="bg-gray-500 text-white p-2 mr-2 rounded"
            >
              Cancel
            </button>
            <button
              (click)="deleteTask(task.id)"
              class="bg-red-500 text-white p-2 rounded"
            >
              Delete
            </button>
          </div>
        </li>
      </ul>
    </div>
  `,
})
export class TaskListComponent implements OnInit {
  tasks: TaskItemWithEditing[] = [];
  newTask: CreateTaskDto = { title: '', description: '', status: 'ToDo' };
  errorMessage: string | null = null;

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Fetched Tasks:', tasks);
        this.tasks = tasks;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error fetching tasks';
        console.error('Error fetching tasks:', err);
        if (err.status === 401) {
          this.router.navigate(['/login']);
        }
      },
    });

    this.taskService.getTaskCreated().subscribe((task) => {
      console.log('New Task via SignalR:', task);
      this.tasks.push(task);
    });

    this.taskService.getTaskUpdated().subscribe((updatedTask) => {
      console.log('Updated Task via SignalR:', updatedTask);
      const index = this.tasks.findIndex((t) => t.id === updatedTask.id);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      } else {
        this.tasks.push(updatedTask);
      }
    });

    this.taskService.getTaskDeleted().subscribe((taskId) => {
      console.log('Deleted Task via SignalR:', taskId);
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
    });
  }

  createTask() {
    console.log('Creating Task:', this.newTask);
    this.taskService.createTask(this.newTask).subscribe({
      next: (task) => {
        this.newTask = { title: '', description: '', status: 'ToDo' };
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error creating task';
        console.error('Error creating task:', err);
      },
    });
  }

  updateTask(task: TaskItemWithEditing) {
    console.log('Updating Task:', task);
    const taskDto: UpdateTaskDto = {
      title: task.title,
      description: task.description,
      status: task.status,
    };
    this.taskService.updateTask(task.id, taskDto).subscribe({
      next: (updatedTask) => {
        console.log('Task Updated:', updatedTask);
        task.isEditing = false;
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error updating task';
        console.error('Error updating task:', err);
      },
    });
  }

  deleteTask(id: number) {
    console.log('Deleting Task:', id);
    this.taskService.deleteTask(id).subscribe({
      next: () => {
        console.log('Task Deleted:', id);
        this.errorMessage = null;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Error deleting task';
        console.error('Error deleting task:', err);
      },
    });
  }
}
