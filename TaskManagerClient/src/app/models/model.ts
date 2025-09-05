export interface TaskItem {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  assignedToId: string;
}

export interface TaskItemWithEditing extends TaskItem {
  isEditing: boolean;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: string;
}

export interface UpdateTaskDto {
  title: string;
  description: string;
  status: string;
}