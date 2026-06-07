namespace WorkLaneX.Application.Common.Models;

public record TaskBreakdownResult(
    Guid TaskId,
    string TaskTitle,
    bool UsedMockProvider,
    IReadOnlyList<SuggestedSubtaskSummary> Subtasks);
