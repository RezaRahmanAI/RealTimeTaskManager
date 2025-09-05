using Microsoft.AspNetCore.SignalR;

namespace TaskManagerApi.Hubs
{
    public class TaskHub : Hub
    {
        public async Task SendTaskUpdate(string taskId, string status)
        {
            await Clients.All.SendAsync("ReceiveTaskUpdate", taskId, status);
        }
    }
}
