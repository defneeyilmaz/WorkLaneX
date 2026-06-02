namespace WorkLaneX.Application.Common.Models;

public record TaskCommentSummary(
    Guid Id,
    Guid TaskId,
    string Body,
    Guid AuthorId,
    string AuthorName,
    DateTime CreatedAt);
