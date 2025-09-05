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

        public TasksController(TaskDbContext context, IHubContext<TaskHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"GetTasks: userId={userId}");
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { Error = "User ID not found" });
            }
            var tasks = await _context.Tasks
                .Where(t => t.AssignedToId == userId)
                .ToListAsync();
            Console.WriteLine($"GetTasks: Returning {tasks.Count} tasks: {JsonSerializer.Serialize(tasks)}");
            return tasks;
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask([FromBody] CreateTaskDto taskDto)
        {
            try
            {
                Console.WriteLine($"CreateTask: Title={taskDto.Title}, Description={taskDto.Description}, Status={taskDto.Status}");
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Error = "User ID not found" });
                }

                var task = new TaskItem
                {
                    Title = taskDto.Title,
                    Description = taskDto.Description,
                    Status = taskDto.Status ?? "ToDo",
                    AssignedToId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Task Created: {JsonSerializer.Serialize(task)}");
                await _hubContext.Clients.All.SendAsync("ReceiveTaskCreated", task);
                return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, task);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CreateTask Exception: {ex.Message}");
                return StatusCode(500, new { Error = "Task creation failed", Details = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDto taskDto)
        {
            try
            {
                Console.WriteLine($"UpdateTask: id={id}, Status={taskDto.Status}");
                if (!ModelState.IsValid)
                {
                    return BadRequest(new { Errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage) });
                }
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Error = "User ID not found" });
                }
                var task = await _context.Tasks.FindAsync(id);
                if (task == null || task.AssignedToId != userId)
                {
                    return NotFound(new { Error = "Task not found or access denied" });
                }
                task.Status = taskDto.Status;
                _context.Entry(task).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                Console.WriteLine($"Task Updated: {JsonSerializer.Serialize(task)}");
                await _hubContext.Clients.All.SendAsync("ReceiveTaskUpdate", task.Id, task.Status);
                return Ok(task);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateTask Exception: {ex.Message}");
                return StatusCode(500, new { Error = "Task update failed", Details = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
             {
                Console.WriteLine($"DeleteTask Id = ", id);
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { Error = "User not found" });
                }

                var task = await _context.Tasks.Where(t => t.Id == id && t.AssignedToId == userId).FirstOrDefaultAsync();
                if (task == null) return NotFound(new { Error = "Task not found " });

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Task Deleted: Id = {id}");
                await _hubContext.Clients.All.SendAsync("ReceiveTaskDeleted", id);
                return NoContent();
            }catch (Exception ex)
            {
                Console.WriteLine($"DeleteTask Exception: {ex.Message}");
                return StatusCode(500, new { Error = "Task deletion failed", Details = ex.Message });
            }
        }
    }
}