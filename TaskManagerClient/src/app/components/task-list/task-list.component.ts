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
    <div class="container mx-auto p-6 bg-gray-100 min-h-screen">
      <h1 class="text-3xl font-bold text-gray-800 mb-6">Task Manager</h1>
      <div
        *ngIf="errorMessage"
        class="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
      >
        {{ errorMessage }}
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div class="flex-1">
          <label
            for="searchQuery"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Search Tasks</label
          >
          <input
            id="searchQuery"
            [(ngModel)]="searchQuery"
            (input)="applyFilter()"
            placeholder="Search by title or description"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex-1">
          <label
            for="statusFilter"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Filter by Status</label
          >
          <select
            id="statusFilter"
            [(ngModel)]="statusFilter"
            (change)="applyFilter()"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="All">All</option>
            <option value="ToDo">ToDo</option>
            <option value="InProgress">InProgress</option>
            <option value="Done">Done</option>
          </select>
        </div>
        <div class="flex-1">
          <label
            for="newTaskTitle"
            class="block text-sm font-medium text-gray-700 mb-1"
            >New Task Title</label
          >
          <input
            id="newTaskTitle"
            [(ngModel)]="newTask.title"
            placeholder="Task Title"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="flex-1">
          <label
            for="newTaskDesc"
            class="block text-sm font-medium text-gray-700 mb-1"
            >Description</label
          >
          <input
            id="newTaskDesc"
            [(ngModel)]="newTask.description"
            placeholder="Description"
            class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          (click)="createTask()"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 self-end"
        >
          Add Task
        </button>
      </div>
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <ul>
          <li
            *ngFor="let task of filteredTasks"
            class="border-b last:border-b-0 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between hover:bg-gray-50"
          >
            <div class="flex-1 mb-2 sm:mb-0">
              <div *ngIf="!task.isEditing; else editMode">
                <span class="text-gray-800 font-medium">{{
                  task.title || 'No Title'
                }}</span>
                <span class="text-gray-600">
                  - {{ task.description || 'No Description' }}</span
                >
                <span class="text-gray-500 text-sm">
                  ({{ task.status || 'No Status' }})</span
                >
              </div>
              <ng-template #editMode>
                <input
                  [(ngModel)]="task.title"
                  placeholder="Task Title"
                  class="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2 sm:mr-2 sm:mb-0"
                />
                <input
                  [(ngModel)]="task.description"
                  placeholder="Description"
                  class="w-full sm:w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </ng-template>
            </div>
            <div class="flex items-center gap-2">
              <select
                [(ngModel)]="task.status"
                (change)="updateTask(task)"
                class="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ToDo">ToDo</option>
                <option value="InProgress">InProgress</option>
                <option value="Done">Done</option>
              </select>
              <button
                *ngIf="!task.isEditing"
                (click)="task.isEditing = true"
                class="bg-yellow-500 text-white px-3 py-2 rounded-lg hover:bg-yellow-600 transition duration-200"
              >
                Edit
              </button>
              <button
                *ngIf="task.isEditing"
                (click)="updateTask(task)"
                class="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition duration-200"
              >
                Save
              </button>
              <button
                *ngIf="task.isEditing"
                (click)="task.isEditing = false"
                class="bg-gray-500 text-white px-3 py-2 rounded-lg hover:bg-gray-600 transition duration-200"
              >
                Cancel
              </button>
              <button
                (click)="deleteTask(task.id)"
                class="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition duration-200"
              >
                Delete
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class TaskListComponent implements OnInit {
  tasks: TaskItemWithEditing[] = [];
  filteredTasks: TaskItemWithEditing[] = [];
  newTask: CreateTaskDto = { title: '', description: '', status: 'ToDo' };
  errorMessage: string | null = null;
  statusFilter: string = 'All';
  searchQuery: string = '';

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        console.log('Fetched Tasks:', tasks);
        this.tasks = tasks;
        this.applyFilter();
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
      this.applyFilter();
    });

    this.taskService.getTaskUpdated().subscribe((updatedTask) => {
      console.log('Updated Task via SignalR:', updatedTask);
      const index = this.tasks.findIndex((t) => t.id === updatedTask.id);
      if (index !== -1) {
        this.tasks[index] = updatedTask;
      } else {
        this.tasks.push(updatedTask);
      }
      this.applyFilter();
    });

    this.taskService.getTaskDeleted().subscribe((taskId) => {
      console.log('Deleted Task via SignalR:', taskId);
      this.tasks = this.tasks.filter((t) => t.id !== taskId);
      this.applyFilter();
    });
  }

  applyFilter() {
    console.log('Applying Filter:', {
      statusFilter: this.statusFilter,
      searchQuery: this.searchQuery,
    });
    let filtered = [...this.tasks];

    // Apply status filter
    if (this.statusFilter !== 'All') {
      filtered = filtered.filter((t) => t.status === this.statusFilter);
    }

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.trim().toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query)
      );
    }

    this.filteredTasks = filtered;
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
