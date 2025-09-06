using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using TaskManagerApi.Data;
using TaskManagerApi.Dtos;
using TaskManagerApi.Hubs;
using TaskManagerApi.Models;

namespace TaskManagerApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly TaskDbContext _context;
        private readonly IHubContext<TaskHub> _hubContext;
        private readonly IWebHostEnvironment _environment;  // Added for file uploads

        public TasksController(TaskDbContext context, IHubContext<TaskHub> hubContext, IWebHostEnvironment environment)
        {
            _context = context;
            _hubContext = hubContext;
            _environment = environment;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks(int? projectId = null, string? status = null, string? priority = null, DateTime? dueDate = null, string? search = null)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var query = _context.Tasks
                .Include(t => t.Project)
                .Include(t => t.Comments)
                .Include(t => t.Attachments)
                .Where(t => t.AssignedToId == userId || t.Project.Members.Any(m => m.Id == userId));  // Visible to assignees or project members

            if (projectId.HasValue) query = query.Where(t => t.ProjectId == projectId);
            if (!string.IsNullOrEmpty(status)) query = query.Where(t => t.Status == status);
            if (!string.IsNullOrEmpty(priority)) query = query.Where(t => t.Priority == priority);
            if (dueDate.HasValue) query = query.Where(t => t.DueDate == dueDate);
            if (!string.IsNullOrEmpty(search)) query = query.Where(t => t.Title.Contains(search) || t.Description.Contains(search));

            var tasks = await query.ToListAsync();
            return Ok(tasks);
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask([FromBody] CreateTaskDto taskDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var project = await _context.Projects.FindAsync(taskDto.ProjectId);
            if (project == null || !project.Members.Any(m => m.Id == userId)) return Forbid();

            var task = new TaskItem
            {
                Title = taskDto.Title,
                Description = taskDto.Description,
                Status = taskDto.Status,
                Priority = taskDto.Priority,
                DueDate = taskDto.DueDate,
                AssignedToId = taskDto.AssignedToId ?? userId,
                ProjectId = taskDto.ProjectId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group($"project-{task.ProjectId}").SendAsync("ReceiveTaskCreated", task);
            return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, task);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto taskDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
            if (task == null || (task.AssignedToId != userId && !task.Project.Members.Any(m => m.Id == userId))) return NotFound();

            task.Title = taskDto.Title;
            task.Description = taskDto.Description;
            task.Status = taskDto.Status;
            task.Priority = taskDto.Priority;
            task.DueDate = taskDto.DueDate;
            task.AssignedToId = taskDto.AssignedToId ?? task.AssignedToId;

            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group($"project-{task.ProjectId}").SendAsync("ReceiveTaskUpdate", task.Id, task.Status);
            return Ok(task);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
            if (task == null || (task.AssignedToId != userId && !task.Project.Members.Any(m => m.Id == userId))) return NotFound();

            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group($"project-{task.ProjectId}").SendAsync("ReceiveTaskDeleted", id);
            return NoContent();
        }

        // Advanced: Comments
        [HttpPost("{taskId}/comments")]
        public async Task<IActionResult> AddComment(int taskId, [FromBody] CommentDto commentDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null || !task.Project.Members.Any(m => m.Id == userId)) return Forbid();

            var comment = new Comment { Content = commentDto.Content, UserId = userId, TaskId = taskId };
            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group($"project-{task.ProjectId}").SendAsync("ReceiveCommentAdded", taskId, comment);
            await SendNotification(task.AssignedToId, $"New comment on task {task.Title}");
            return Ok(comment);
        }

        // Advanced: Attachments
        [HttpPost("{taskId}/attachments")]
        public async Task<IActionResult> UploadAttachment(int taskId, [FromForm] AttachmentDto attachmentDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var task = await _context.Tasks.Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == taskId);
            if (task == null || !task.Project.Members.Any(m => m.Id == userId)) return Forbid();

            if (attachmentDto.File == null || attachmentDto.File.Length == 0) return BadRequest("No file uploaded");

            var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads");
            if (!Directory.Exists(uploadsFolder)) Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, attachmentDto.File.FileName);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await attachmentDto.File.CopyToAsync(stream);
            }

            var attachment = new Attachment { FileName = attachmentDto.File.FileName, FilePath = $"/uploads/{attachmentDto.File.FileName}", TaskId = taskId };
            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();
            return Ok(attachment);
        }

        // Helper for notifications
        private async Task SendNotification(string? userId, string message)
        {
            if (!string.IsNullOrEmpty(userId))
            {
                var notification = new Notification { Message = message, UserId = userId };
                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.User(userId).SendAsync("ReceiveNotification", notification);
            }
        }
    }
}