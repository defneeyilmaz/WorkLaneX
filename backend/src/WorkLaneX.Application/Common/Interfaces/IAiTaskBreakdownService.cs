using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Common.Interfaces;

public interface IAiTaskBreakdownService
{
    Task<(IReadOnlyList<SuggestedSubtaskSummary> Subtasks, bool UsedMockProvider)> BreakDownAsync(
        string taskTitle,
        string? taskDescription,
        int maxSubtasks,
        CancellationToken cancellationToken = default);
}
