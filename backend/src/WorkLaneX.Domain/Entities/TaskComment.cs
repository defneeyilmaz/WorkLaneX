using WorkLaneX.Domain.Common;

namespace WorkLaneX.Domain.Entities;

public class TaskComment : BaseEntity
{
    public Guid TaskId { get; set; }
    public TaskItem Task { get; set; } = null!;

    public Guid AuthorId { get; set; }
    public string Body { get; set; } = string.Empty;
}
