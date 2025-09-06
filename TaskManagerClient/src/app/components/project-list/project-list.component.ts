import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskService } from '../../services/task.service';
import { SignalRService } from '../../services/signalr.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Project } from '../../models/model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css'],
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  projectForm: FormGroup;
  addMemberForm: FormGroup;
  @Output() projectCreated = new EventEmitter<void>();
  @Output() projectJoined = new EventEmitter<void>();

  constructor(
    private taskService: TaskService,
    private signalRService: SignalRService,
    private fb: FormBuilder
  ) {
    this.projectForm = fb.group({
      name: ['', Validators.required],
      description: [''],
    });
    this.addMemberForm = fb.group({
      projectId: ['', Validators.required],
      username: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loadProjects();
    this.signalRService.projectUpdated.subscribe((project: Project) => {
      const idx = this.projects.findIndex((p) => p.id === project.id);
      if (idx > -1) {
        this.projects[idx] = project;
      } else {
        this.projects.push(project);
        this.signalRService.joinProjectGroup(project.id);
      }
    });
  }

  loadProjects() {
    this.taskService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        projects.forEach((p) => this.signalRService.joinProjectGroup(p.id));
        this.projectCreated.emit();
      },
      error: (err) => console.error('Error loading projects:', err),
    });
  }

  createProject() {
    if (this.projectForm.valid) {
      this.taskService.createProject(this.projectForm.value).subscribe({
        next: () => {
          this.projectForm.reset();
          this.loadProjects();
        },
        error: (err) => console.error('Error creating project:', err),
      });
    }
  }

  joinProject(id: number) {
    this.taskService.joinProject(id).subscribe({
      next: () => {
        this.loadProjects();
        this.projectJoined.emit();
      },
      error: (err) => console.error('Error joining project:', err),
    });
  }

  addMember() {
    if (this.addMemberForm.valid) {
      const { projectId, username } = this.addMemberForm.value;
      this.taskService.addMember(projectId, username).subscribe({
        next: () => this.loadProjects(),
        error: (err) =>
          alert('Error adding member: ' + (err.error?.Error || err.message)),
      });
    }
  }
}
