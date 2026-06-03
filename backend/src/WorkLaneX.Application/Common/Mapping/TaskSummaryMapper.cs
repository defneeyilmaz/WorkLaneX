using WorkLaneX.Application.Common.Models;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Application.Common.Mapping;

public static class TaskSummaryMapper
{
    public static TaskSummary ToSummary(
        TaskItem task,
        IReadOnlyDictionary<Guid, string> userNames)
    {
        string? assigneeName = null;
        if (task.AssigneeId is Guid assigneeId &&
            userNames.TryGetValue(assigneeId, out var name))
        {
            assigneeName = name;
        }

        return new TaskSummary(
            task.Id,
            task.ProjectId,
            task.Title,
            task.Description,
            task.Status,
            task.SortOrder,
            task.Priority,
            task.CreatedAt,
            task.AssigneeId,
            assigneeName,
            task.ApprovalStatus,
            task.CompletionNote,
            task.RejectionNote);
    }
}
