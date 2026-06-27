namespace WorkLaneX.Application.Common.Models;

public record ProjectDocumentDetail(
    Guid Id,
    Guid ProjectId,
    string Title,
    string Content,
    string Type,
    DateTime? MeetingHeldAt,
    Guid AuthorId,
    string AuthorName,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
