using Microsoft.EntityFrameworkCore;
using ProjectManager.Data;
using ProjectManager.DTOs;
using ProjectManager.Models;

namespace ProjectManager.Services;

public interface ITaskService
{
    Task<TaskDto?> CreateTask(int projectId, CreateTaskRequest request, int userId);
    Task<TaskDto?> UpdateTask(int taskId, UpdateTaskRequest request, int userId);
    Task<bool> DeleteTask(int taskId, int userId);
}

public class TaskService : ITaskService
{
    private readonly AppDbContext _context;

    public TaskService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<TaskDto?> CreateTask(int projectId, CreateTaskRequest request, int userId)
    {
        // Verify project belongs to user
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null)
            return null;

        var task = new ProjectTask
        {
            Title = request.Title,
            DueDate = request.DueDate,
            ProjectId = projectId,
            IsCompleted = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            DueDate = task.DueDate,
            IsCompleted = task.IsCompleted,
            ProjectId = task.ProjectId,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task<TaskDto?> UpdateTask(int taskId, UpdateTaskRequest request, int userId)
    {
        // Get task and verify ownership through project
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.UserId == userId);

        if (task == null)
            return null;

        // Update only provided fields
        if (request.Title != null)
            task.Title = request.Title;
        
        if (request.DueDate.HasValue)
            task.DueDate = request.DueDate;
        
        if (request.IsCompleted.HasValue)
            task.IsCompleted = request.IsCompleted.Value;

        await _context.SaveChangesAsync();

        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            DueDate = task.DueDate,
            IsCompleted = task.IsCompleted,
            ProjectId = task.ProjectId,
            CreatedAt = task.CreatedAt
        };
    }

    public async Task<bool> DeleteTask(int taskId, int userId)
    {
        var task = await _context.Tasks
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == taskId && t.Project.UserId == userId);

        if (task == null)
            return false;

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();
        return true;
    }
}