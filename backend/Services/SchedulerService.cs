using ProjectManager.DTOs;

namespace ProjectManager.Services;

public interface ISchedulerService
{
    ScheduleResponse GenerateSchedule(ScheduleProjectRequest request);
}

public class SchedulerService : ISchedulerService
{
    public ScheduleResponse GenerateSchedule(ScheduleProjectRequest request)
    {
        var response = new ScheduleResponse();
        var warnings = new List<ScheduleWarning>();
        
        // Validate dependencies exist
        var taskTitles = request.Tasks.Select(t => t.Title).ToHashSet();
        foreach (var task in request.Tasks)
        {
            foreach (var dependency in task.Dependencies)
            {
                if (!taskTitles.Contains(dependency))
                {
                    warnings.Add(new ScheduleWarning
                    {
                        Task = task.Title,
                        Message = $"Dependency '{dependency}' not found in task list",
                        Severity = "Error"
                    });
                }
            }
        }

        // Check for circular dependencies
        var circularDeps = DetectCircularDependencies(request.Tasks);
        if (circularDeps.Any())
        {
            warnings.Add(new ScheduleWarning
            {
                Task = string.Join(", ", circularDeps),
                Message = "Circular dependency detected",
                Severity = "Error"
            });
            
            response.Warnings = warnings;
            return response;
        }

        // Perform topological sort to get recommended order
        var sortedTasks = TopologicalSort(request.Tasks);
        response.RecommendedOrder = sortedTasks.Select(t => t.Title).ToList();

        // Check for tasks at risk (due date conflicts)
        CheckDueDateConflicts(sortedTasks, warnings);

        // Calculate metrics
        response.Metrics = CalculateMetrics(sortedTasks);
        response.Warnings = warnings;

        return response;
    }

    private List<ScheduleTaskInput> TopologicalSort(List<ScheduleTaskInput> tasks)
    {
        var sorted = new List<ScheduleTaskInput>();
        var visited = new HashSet<string>();
        var taskDict = tasks.ToDictionary(t => t.Title, t => t);

        void Visit(ScheduleTaskInput task)
        {
            if (visited.Contains(task.Title))
                return;

            visited.Add(task.Title);

            // Visit dependencies first
            foreach (var depTitle in task.Dependencies)
            {
                if (taskDict.ContainsKey(depTitle))
                {
                    Visit(taskDict[depTitle]);
                }
            }

            sorted.Add(task);
        }

        foreach (var task in tasks)
        {
            Visit(task);
        }

        return sorted;
    }

    private List<string> DetectCircularDependencies(List<ScheduleTaskInput> tasks)
    {
        var taskDict = tasks.ToDictionary(t => t.Title, t => t);
        var visiting = new HashSet<string>();
        var visited = new HashSet<string>();
        var cycle = new List<string>();

        bool HasCycle(string taskTitle, List<string> path)
        {
            if (visiting.Contains(taskTitle))
            {
                // Found a cycle
                cycle = path.SkipWhile(t => t != taskTitle).ToList();
                cycle.Add(taskTitle);
                return true;
            }

            if (visited.Contains(taskTitle))
                return false;

            if (!taskDict.ContainsKey(taskTitle))
                return false;

            visiting.Add(taskTitle);
            path.Add(taskTitle);

            var task = taskDict[taskTitle];
            foreach (var dep in task.Dependencies)
            {
                if (HasCycle(dep, path))
                    return true;
            }

            visiting.Remove(taskTitle);
            visited.Add(taskTitle);
            path.RemoveAt(path.Count - 1);

            return false;
        }

        foreach (var task in tasks)
        {
            if (HasCycle(task.Title, new List<string>()))
                return cycle;
        }

        return new List<string>();
    }

    private void CheckDueDateConflicts(List<ScheduleTaskInput> sortedTasks, List<ScheduleWarning> warnings)
    {
        var currentDate = DateTime.UtcNow;
        var taskCompletionDates = new Dictionary<string, DateTime>();

        foreach (var task in sortedTasks)
        {
            // Calculate earliest start date based on dependencies
            var earliestStart = currentDate;
            foreach (var dep in task.Dependencies)
            {
                if (taskCompletionDates.ContainsKey(dep))
                {
                    var depCompletion = taskCompletionDates[dep];
                    if (depCompletion > earliestStart)
                        earliestStart = depCompletion;
                }
            }

            // Calculate completion date
            var estimatedCompletion = earliestStart.AddHours(task.EstimatedHours);
            taskCompletionDates[task.Title] = estimatedCompletion;

            // Check against due date
            if (!string.IsNullOrEmpty(task.DueDate))
            {
                if (DateTime.TryParse(task.DueDate, out var dueDate))
                {
                    if (estimatedCompletion > dueDate)
                    {
                        warnings.Add(new ScheduleWarning
                        {
                            Task = task.Title,
                            Message = $"Task may not complete by due date. Estimated: {estimatedCompletion:yyyy-MM-dd}, Due: {dueDate:yyyy-MM-dd}",
                            Severity = "Warning"
                        });
                    }
                }
            }
        }
    }

    private ScheduleMetrics CalculateMetrics(List<ScheduleTaskInput> sortedTasks)
    {
        var totalHours = sortedTasks.Sum(t => t.EstimatedHours);
        var currentDate = DateTime.UtcNow;
        
        // Calculate critical path (longest path through dependencies)
        var criticalPath = CalculateCriticalPath(sortedTasks);
        
        // Estimate completion date (assuming 8 hours per work day)
        var workDays = (int)Math.Ceiling(totalHours / 8.0);
        var estimatedCompletion = currentDate.AddDays(workDays);

        return new ScheduleMetrics
        {
            TotalTasks = sortedTasks.Count,
            TotalEstimatedHours = totalHours,
            CriticalPathLength = criticalPath,
            EstimatedCompletionDate = estimatedCompletion.ToString("yyyy-MM-dd")
        };
    }

    private int CalculateCriticalPath(List<ScheduleTaskInput> tasks)
    {
        var taskDict = tasks.ToDictionary(t => t.Title, t => t);
        var memo = new Dictionary<string, int>();

        int GetPathLength(string taskTitle)
        {
            if (memo.ContainsKey(taskTitle))
                return memo[taskTitle];

            if (!taskDict.ContainsKey(taskTitle))
                return 0;

            var task = taskDict[taskTitle];
            var maxDepPath = 0;

            foreach (var dep in task.Dependencies)
            {
                var depPath = GetPathLength(dep);
                if (depPath > maxDepPath)
                    maxDepPath = depPath;
            }

            var result = task.EstimatedHours + maxDepPath;
            memo[taskTitle] = result;
            return result;
        }

        var maxPath = 0;
        foreach (var task in tasks)
        {
            var pathLength = GetPathLength(task.Title);
            if (pathLength > maxPath)
                maxPath = pathLength;
        }

        return maxPath;
    }
}