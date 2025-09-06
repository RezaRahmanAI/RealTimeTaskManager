using System.Net.Mail;

namespace TaskManagerApi.Models
{
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";  // Changed default to match features (Pending, In Progress, Completed)
        public string Priority { get; set; } = "Medium";  // Low, Medium, High
        public DateTime? DueDate { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? AssignedToId { get; set; }
        public int ProjectId { get; set; }  // Foreign key to Project
        public Project? Project { get; set; }  // Navigation
        public ICollection<Comment>? Comments { get; set; }  // For advanced
        public ICollection<Attachment>? Attachments { get; set; }  // For advanced
    }
}