namespace WorkLaneX.Application.Common.Models;

public record ProjectMessageSummary(
    Guid Id,
    Guid ProjectId,
    string Body,
    Guid AuthorId,
    string AuthorName,
    DateTime CreatedAt);
