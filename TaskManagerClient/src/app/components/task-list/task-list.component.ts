import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TaskItem } from '../../models/model';
import { TaskService } from '../../services/task.service';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.css',
})
export class TaskListComponent implements OnInit {
  tasks: TaskItem[] = [];
  newTask: TaskItem = {
    id: 0,
    title: '',
    description: '',
    status: 'ToDo',
    createdAt: '',
  };

  /**
   *
   */
  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.taskService.getTasks().subscribe((tasks) => (this.tasks = tasks));
    this.taskService.getTaskUpdates().subscribe((update) => {
      const task = this.tasks.find((t) => t.id === +update.taskId);
      if (task) task.status = update.status;
    });
  }

  addTask() {
    this.taskService.createTask(this.newTask).subscribe(task => {
      this.tasks.push(task)
      this.newTask = {id: 0, title: '', description: '', status: 'ToDo', createdAt: ''}
    })
  }
}
