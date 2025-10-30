using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectManager.DTOs;
using ProjectManager.Services;

namespace ProjectManager.Controllers;

[ApiController]
[Route("api/v1/projects/{projectId}/schedule")]
[Authorize]
public class SchedulerController : ControllerBase
{
    private readonly ISchedulerService _schedulerService;

    public SchedulerController(ISchedulerService schedulerService)
    {
        _schedulerService = schedulerService;
    }

    /// <summary>
    /// Generate an optimized schedule for a project based on tasks and dependencies
    /// </summary>
    /// <param name="projectId">The project ID (for future integration)</param>
    /// <param name="request">Tasks with dependencies and estimated hours</param>
    /// <returns>Recommended order and scheduling insights</returns>
    [HttpPost]
    public ActionResult<ScheduleResponse> GenerateSchedule(
        string projectId, 
        [FromBody] ScheduleProjectRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var schedule = _schedulerService.GenerateSchedule(request);

            // If there are errors in the schedule, return bad request
            if (schedule.Warnings.Any(w => w.Severity == "Error"))
            {
                return BadRequest(schedule);
            }

            return Ok(schedule);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to generate schedule", error = ex.Message });
        }
    }
}