import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../../models/model';
import { CreateTaskDto, TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  tasks: TaskItem[] = [];
  newTask: CreateTaskDto = {
    
    title: '',
    description: '',
    status: 'ToDo',
    
  };

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.taskService.getTasks().subscribe({
      next: (tasks) => this.tasks = tasks,
      error: (err) => console.error('Error fetching tasks: ', err)
    })

    this.taskService.getTaskCreated().subscribe({
      next: (task) => {
        this.tasks.push(task);
      },
      error: (err) => console.error('Error receiving task:', err),
    });
  }

  addTask() {
    this.taskService.createTask(this.newTask).subscribe(task => {
      this.tasks.push(task)
      this.newTask = { title: '', description: '', status: 'ToDo',}
    })
  }
}
