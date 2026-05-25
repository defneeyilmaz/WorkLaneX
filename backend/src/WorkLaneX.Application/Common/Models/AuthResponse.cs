namespace WorkLaneX.Application.Common.Models;

public record AuthResponse(
    string AccessToken,
    int ExpiresInMinutes,
    UserSummary User);

public record UserSummary(Guid Id, string Email, string FullName);
