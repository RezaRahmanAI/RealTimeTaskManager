using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
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
    public class ProjectsController : ControllerBase
    {
        private readonly TaskDbContext _context;
        private readonly UserManager<IdentityUser> _userManager;
        private readonly IHubContext<TaskHub> _hubContext;

        public ProjectsController(TaskDbContext context, UserManager<IdentityUser> userManager, IHubContext<TaskHub> hubContext)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Project>>> GetProjects()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return await _context.Projects
                .Include(p => p.Tasks)
                .Include(p => p.Members)
                .Where(p => p.Members.Any(m => m.Id == userId) || p.OwnerId == userId)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Project>> CreateProject([FromBody] CreateProjectDto projectDto)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);
            var project = new Project
            {
                Name = projectDto.Name,
                Description = projectDto.Description,
                OwnerId = userId,
                Members = new List<IdentityUser> { user }
            };
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.Group($"project-{project.Id}").SendAsync("ReceiveProjectUpdate", project);
            return CreatedAtAction(nameof(GetProjects), new { id = project.Id }, project);
        }

        [HttpPost("{id}/join")]
        public async Task<IActionResult> JoinProject(int id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
            if (project == null) return NotFound();

            var user = await _userManager.FindByIdAsync(userId);
            if (!project.Members.Contains(user))
            {
                project.Members.Add(user);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.Group($"project-{id}").SendAsync("ReceiveProjectUpdate", project);
            }
            return Ok();
        }

        [HttpPost("{id}/add-member")]
        [Authorize(Roles = "Admin")]  // Admin only
        public async Task<IActionResult> AddMember(int id, [FromBody] string memberUsername)
        {
            var project = await _context.Projects.Include(p => p.Members).FirstOrDefaultAsync(p => p.Id == id);
            if (project == null) return NotFound();

            var member = await _userManager.FindByNameAsync(memberUsername);
            if (member == null) return NotFound("User not found");

            if (!project.Members.Contains(member))
            {
                project.Members.Add(member);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.Group($"project-{id}").SendAsync("ReceiveProjectUpdate", project);
            }
            return Ok();
        }
    }
}