using Microsoft.AspNetCore.SignalR;

namespace TaskManagerApi.Hubs
{
    public class TaskHub : Hub
    {
        public async Task JoinProjectGroup(int projectId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"project-{projectId}");
        }

        public async Task LeaveProjectGroup(int projectId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"project-{projectId}");
        }

        public async Task SendTaskUpdate(int taskId, string status)
        {
            await Clients.All.SendAsync("ReceiveTaskUpdate", taskId, status);
        }

        public async Task SendTaskCreated(object task)
        {
            await Clients.All.SendAsync("ReceiveTaskCreated", task);
        }

        public async Task SendTaskDeleted(int taskId)
        {
            await Clients.All.SendAsync("ReceiveTaskDeleted", taskId);
        }

        public async Task SendCommentAdded(int taskId, object comment)
        {
            await Clients.All.SendAsync("ReceiveCommentAdded", taskId, comment);
        }

        public async Task SendNotification(string userId, string message)
        {
            await Clients.User(userId).SendAsync("ReceiveNotification", message);
        }

        public async Task SendProjectUpdate(int projectId, object project)
        {
            await Clients.Group($"project-{projectId}").SendAsync("ReceiveProjectUpdate", project);
        }
    }
}