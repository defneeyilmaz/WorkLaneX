using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Application.Common.Mapping;

public static class ActivityLogFormatter
{
    public static string Format(ActivityActionType action, string? detail)
    {
        return action switch
        {
            ActivityActionType.TaskCreated => "created this task",
            ActivityActionType.TaskStatusChanged => detail is not null
                ? $"moved task: {detail}"
                : "changed task status",
            ActivityActionType.TaskUpdated => detail ?? "updated task details",
            ActivityActionType.TaskCommentAdded => "added a comment",
            ActivityActionType.TaskApproved => "approved completion",
            ActivityActionType.TaskRejected => detail is not null
                ? $"sent task back: {detail}"
                : "rejected completion",
            _ => "updated the task",
        };
    }

    public static string FormatStatusChange(TaskStatusEnum from, TaskStatusEnum to) =>
        $"{FormatStatus(from.ToString())} → {FormatStatus(to.ToString())}";

    private static string FormatStatus(string status) => status switch
    {
        "ToDo" => "To Do",
        "InProgress" => "In Progress",
        "Review" => "Review",
        "Done" => "Done",
        _ => status,
    };
}
