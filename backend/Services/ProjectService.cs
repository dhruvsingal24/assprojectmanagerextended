using Microsoft.EntityFrameworkCore;
using ProjectManager.Data;
using ProjectManager.DTOs;
using ProjectManager.Models;

namespace ProjectManager.Services;

public interface IProjectService
{
    Task<List<ProjectDto>> GetUserProjects(int userId);
    Task<ProjectDetailDto?> GetProjectById(int projectId, int userId);
    Task<ProjectDto?> CreateProject(CreateProjectRequest request, int userId);
    Task<bool> DeleteProject(int projectId, int userId);
}

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;

    public ProjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectDto>> GetUserProjects(int userId)
    {
        return await _context.Projects
            .Where(p => p.UserId == userId)
            .Select(p => new ProjectDto
            {
                Id = p.Id,
                Title = p.Title,
                Description = p.Description,
                CreatedAt = p.CreatedAt,
                TaskCount = p.Tasks.Count
            })
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<ProjectDetailDto?> GetProjectById(int projectId, int userId)
    {
        var project = await _context.Projects
            .Include(p => p.Tasks)
            .Where(p => p.Id == projectId && p.UserId == userId)
            .FirstOrDefaultAsync();

        if (project == null)
            return null;

        return new ProjectDetailDto
        {
            Id = project.Id,
            Title = project.Title,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            Tasks = project.Tasks.Select(t => new TaskDto
            {
                Id = t.Id,
                Title = t.Title,
                DueDate = t.DueDate,
                IsCompleted = t.IsCompleted,
                ProjectId = t.ProjectId,
                CreatedAt = t.CreatedAt
            }).OrderByDescending(t => t.CreatedAt).ToList()
        };
    }

    public async Task<ProjectDto?> CreateProject(CreateProjectRequest request, int userId)
    {
        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return new ProjectDto
        {
            Id = project.Id,
            Title = project.Title,
            Description = project.Description,
            CreatedAt = project.CreatedAt,
            TaskCount = 0
        };
    }

    public async Task<bool> DeleteProject(int projectId, int userId)
    {
        var project = await _context.Projects
            .FirstOrDefaultAsync(p => p.Id == projectId && p.UserId == userId);

        if (project == null)
            return false;

        _context.Projects.Remove(project);
        await _context.SaveChangesAsync();
        return true;
    }
}