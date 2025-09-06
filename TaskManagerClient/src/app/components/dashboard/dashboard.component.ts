import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { TaskListComponent } from '../task-list/task-list.component';
import { ProjectListComponent } from '../project-list/project-list.component';
import { NotificationsComponent } from '../notifications/notifications.component';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskService } from '../../services/task.service';
import { SignalRService } from '../../services/signalr.service';
import { AuthService } from '../../services/auth.service';
import { Task, Project, Comment } from '../../models/model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    NgChartsModule,
    TaskListComponent,
    ProjectListComponent,
    NotificationsComponent,
    TaskFormComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  tasks: Task[] = [];
  projects: Project[] = [];
  filters: any = {};
  pieChartData: ChartConfiguration['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Task Statuses',
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
      },
    ],
  };
  pieChartOptions: ChartConfiguration['options'] = { responsive: true };

  constructor(
    private taskService: TaskService,
    private signalRService: SignalRService,
    public authService: AuthService, // Made public to access in template
    public dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loadTasks();
      this.loadProjects();
      this.signalRService.startConnection();
      this.signalRService.taskCreated.subscribe((task: Task) => {
        this.tasks.push(task);
        this.updateChart();
      });
      this.signalRService.taskUpdated.subscribe(
        (update: { taskId: number; status: string }) => {
          const task = this.tasks.find((t) => t.id === update.taskId);
          if (task) {
            task.status = update.status;
            this.updateChart();
          }
        }
      );
      this.signalRService.taskDeleted.subscribe((id: number) => {
        this.tasks = this.tasks.filter((t) => t.id !== id);
        this.updateChart();
      });
      this.signalRService.commentAdded.subscribe(
        ({ taskId, comment }: { taskId: number; comment: Comment }) => {
          const task = this.tasks.find((t) => t.id === taskId);
          if (task) {
            task.comments = task.comments || [];
            task.comments.push(comment);
          }
        }
      );
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
  }

  loadTasks() {
    this.taskService.getTasks(this.filters).subscribe({
      next: (tasks: Task[]) => {
        this.tasks = tasks;
        this.updateChart();
      },
      error: (err: any) => console.error('Error loading tasks:', err),
    });
  }

  loadProjects() {
    this.taskService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
        projects.forEach((p: Project) =>
          this.signalRService.joinProjectGroup(p.id)
        );
      },
      error: (err: any) => console.error('Error loading projects:', err),
    });
  }

  openTaskForm(task?: Task) {
    const dialogRef = this.dialog.open(TaskFormComponent, {
      data: { task, projects: this.projects },
      width: '500px',
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadTasks();
      }
    });
  }

  applyFilters() {
    this.loadTasks();
  }

  updateChart() {
    const statuses = this.tasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    this.pieChartData = {
      labels: Object.keys(statuses),
      datasets: [
        {
          data: Object.values(statuses),
          label: 'Task Statuses',
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
        },
      ],
    };
  }
}
