namespace TaskManagerApi.Models
{
    public class Attachment
    {
        public int Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;  // Local path or URL
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public int TaskId { get; set; }
        public TaskItem? Task { get; set; }
    }
}