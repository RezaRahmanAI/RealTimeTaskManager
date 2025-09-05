namespace TaskManagerApi.Dtos
{
    public class CreateTaskDto
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Status { get; set; }
    }

    public class UpdateTaskDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
