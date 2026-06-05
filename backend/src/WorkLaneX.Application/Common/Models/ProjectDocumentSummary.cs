namespace WorkLaneX.Application.Common.Models;

public record ProjectDocumentSummary(
    Guid Id,
    Guid ProjectId,
    string Title,
    Guid AuthorId,
    string AuthorName,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
