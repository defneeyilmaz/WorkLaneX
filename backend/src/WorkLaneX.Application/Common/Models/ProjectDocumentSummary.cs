namespace WorkLaneX.Application.Common.Models;

public record ProjectDocumentSummary(
    Guid Id,
    Guid ProjectId,
    string Title,
    string Type,
    DateTime? MeetingHeldAt,
    Guid AuthorId,
    string AuthorName,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
