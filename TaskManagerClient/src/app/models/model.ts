export interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  assignedToId?: string;
  projectId: number;
  project?: Project;
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Project {
  id: number;
  name: string;
  description?: string;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  userId: string;
}

export interface Attachment {
  id: number;
  fileName: string;
  filePath: string;
  createdAt: string;
}
export interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
  userId: string;
}