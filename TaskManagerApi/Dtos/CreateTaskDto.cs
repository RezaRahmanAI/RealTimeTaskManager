namespace TaskManagerApi.Dtos
{
    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string Priority { get; set; } = "Medium";
        public DateTime? DueDate { get; set; }
        public string? AssignedToId { get; set; }
        public int ProjectId { get; set; }
    }

    public class UpdateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public string Priority { get; set; } = "Medium";
        public DateTime? DueDate { get; set; }
        public string? AssignedToId { get; set; }
    }

    public class CreateProjectDto
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class CommentDto
    {
        public string Content { get; set; } = string.Empty;
    }

    public class AttachmentDto
    {
        public IFormFile File { get; set; }  
    }
}
