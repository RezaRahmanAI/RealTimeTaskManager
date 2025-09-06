using Microsoft.AspNetCore.Identity;

namespace TaskManagerApi.Models
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string OwnerId { get; set; } = string.Empty;  
        public ICollection<TaskItem>? Tasks { get; set; }
        public ICollection<IdentityUser>? Members { get; set; }  
    }
}