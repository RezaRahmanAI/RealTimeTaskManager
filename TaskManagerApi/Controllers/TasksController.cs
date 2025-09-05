using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TaskManagerApi.Data;
using TaskManagerApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using TaskManagerApi.Hubs;

namespace TaskManagerApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
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
            return await _context.TaskItems.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<TaskItem>> CreateTask(TaskItem task)
        {
            if(!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            _context.TaskItems.Add(task);
            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("ReceiveTaskCreated", task);

            return CreatedAtAction(nameof(GetTasks), new {id = task.Id}, task);
        }

    }
}
