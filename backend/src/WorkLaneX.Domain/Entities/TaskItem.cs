using WorkLaneX.Domain.Common;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Domain.Entities;

public class TaskItem : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatusEnum Status { get; set; } = TaskStatusEnum.ToDo;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public Guid? AssigneeId { get; set; }
    public string? CompletionNote { get; set; }
    public string? RejectionNote { get; set; }
    public TaskApprovalStatus ApprovalStatus { get; set; } = TaskApprovalStatus.None;
    public DateTime? ApprovedAt { get; set; }
    public Guid? ApprovedById { get; set; }

    public ICollection<TaskComment> Comments { get; set; } = [];
}
