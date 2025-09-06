import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { TaskService } from '../../services/task.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Task, Project } from '../../models/model';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatAutocompleteModule,
  ],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
})
export class TaskFormComponent {
  form: FormGroup;
  projects: Project[] = [];
  users: any[] = [];
  filteredUsers!: Observable<any[]>;

  constructor(
    private fb: FormBuilder,
    private taskService: TaskService,
    public dialogRef: MatDialogRef<TaskFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { task?: Task; projects: Project[] }
  ) {
    this.projects = data.projects || [];
    this.form = fb.group({
      title: [data.task?.title || '', Validators.required],
      description: [data.task?.description || ''],
      status: [data.task?.status || 'Pending', Validators.required],
      priority: [data.task?.priority || 'Medium', Validators.required],
      dueDate: [data.task?.dueDate || '', Validators.required],
      assignedToId: [data.task?.assignedToId || ''],
      projectId: [data.task?.projectId || '', Validators.required],
    });

    this.filteredUsers = this.form.get('assignedToId')!.valueChanges.pipe(
      startWith(''),
      map((value) => this.filterUsers(value || ''))
    );
  }

  ngOnInit() {
    this.searchUsers('');
  }

  save() {
    if (this.form.valid) {
      const task = this.form.value;
      if (this.data.task) {
        this.taskService.updateTask(this.data.task.id, task).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('Error updating task:', err),
        });
      } else {
        this.taskService.createTask(task).subscribe({
          next: () => this.dialogRef.close(true),
          error: (err) => console.error('Error creating task:', err),
        });
      }
    }
  }

  searchUsers(query: string) {
    this.taskService.searchUsers(query).subscribe({
      next: (users) => (this.users = users),
      error: (err) => console.error('Error searching users:', err),
    });
  }

  private filterUsers(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.users.filter((user) =>
      user.userName.toLowerCase().includes(filterValue)
    );
  }

  displayUser(user: any): string {
    return user ? user.userName : '';
  }
}
