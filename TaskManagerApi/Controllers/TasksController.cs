using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
            //var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            //Console.WriteLine($"GetTasks: userId={userId}");
            //if (string.IsNullOrEmpty(userId))
            //{
            //    return Unauthorized(new { Error = "User ID not found" });
            //}
            //return await _context.Tasks
            //    .Where(t => t.AssignedToId == userId)
            //    .ToListAsync();

            return await _context.Tasks.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask([FromBody] CreateTaskDto taskDto)
        {
            try
            {
                Console.WriteLine($"CreateTask: Title={taskDto.Title}");
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
                await _hubContext.Clients.All.SendAsync("ReceiveTaskCreated", task);
                return CreatedAtAction(nameof(GetTasks), new { id = task.Id }, task);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CreateTask Exception: {ex.Message}");
                return StatusCode(500, new { Error = "Task creation failed", Details = ex.Message });
            }
        }
    }
}