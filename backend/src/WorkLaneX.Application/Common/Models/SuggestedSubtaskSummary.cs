using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Application.Common.Models;

public record SuggestedSubtaskSummary(
    string Title,
    string? Description,
    TaskPriority Priority);
