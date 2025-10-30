using System.ComponentModel.DataAnnotations;

namespace ProjectManager.DTOs;

public class ScheduleTaskInput
{
    [Required]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    [Range(1, 1000)]
    public int EstimatedHours { get; set; }
    
    public string? DueDate { get; set; }
    
    public List<string> Dependencies { get; set; } = new();
}

public class ScheduleProjectRequest
{
    [Required]
    [MinLength(1)]
    public List<ScheduleTaskInput> Tasks { get; set; } = new();
}

public class ScheduleResponse
{
    public List<string> RecommendedOrder { get; set; } = new();
    public List<ScheduleWarning> Warnings { get; set; } = new();
    public ScheduleMetrics Metrics { get; set; } = new();
}

public class ScheduleWarning
{
    public string Task { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Severity { get; set; } = "Warning"; // Info, Warning, Error
}

public class ScheduleMetrics
{
    public int TotalTasks { get; set; }
    public int TotalEstimatedHours { get; set; }
    public int CriticalPathLength { get; set; }
    public string EstimatedCompletionDate { get; set; } = string.Empty;
}