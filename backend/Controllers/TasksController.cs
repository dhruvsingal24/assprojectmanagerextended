using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ProjectManager.DTOs;
using ProjectManager.Services;

namespace ProjectManager.Controllers;

[ApiController]
[Authorize]
public class TasksController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TasksController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    private int GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(userIdClaim ?? "0");
    }

    [HttpPost("api/projects/{projectId}/tasks")]
    public async Task<ActionResult<TaskDto>> CreateTask(int projectId, [FromBody] CreateTaskRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        var task = await _taskService.CreateTask(projectId, request, userId);

        if (task == null)
            return NotFound(new { message = "Project not found" });

        return CreatedAtAction(nameof(CreateTask), new { projectId = projectId, id = task.Id }, task);
    }

    [HttpPut("api/tasks/{taskId}")]
    public async Task<ActionResult<TaskDto>> UpdateTask(int taskId, [FromBody] UpdateTaskRequest request)
    {
        var userId = GetUserId();
        var task = await _taskService.UpdateTask(taskId, request, userId);

        if (task == null)
            return NotFound(new { message = "Task not found" });

        return Ok(task);
    }

    [HttpDelete("api/tasks/{taskId}")]
    public async Task<ActionResult> DeleteTask(int taskId)
    {
        var userId = GetUserId();
        var success = await _taskService.DeleteTask(taskId, userId);

        if (!success)
            return NotFound(new { message = "Task not found" });

        return NoContent();
    }
}