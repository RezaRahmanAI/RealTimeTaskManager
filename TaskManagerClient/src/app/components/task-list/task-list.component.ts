import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  TaskService,
  TaskItem,
  CreateTaskDto,
} from '../../services/task.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css'
})
export class TaskListComponent implements OnInit {
  tasks: TaskItem[] = [];
  newTask: CreateTaskDto = { title: '', description: '', status: 'ToDo' };
  errorMessage: string | null = null;

  constructor(private taskService: TaskService, private router: Router) {}

  ngOnInit() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
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
      this.tasks.push(task);
    });
  }

  createTask() {
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
}
