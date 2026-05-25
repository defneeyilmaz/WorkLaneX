using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Common.Interfaces;

public interface IUserAccountService
{
    Task<OperationResult<AuthResponse>> RegisterAsync(
        string email,
        string password,
        string fullName,
        CancellationToken cancellationToken = default);

    Task<OperationResult<AuthResponse>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<UserSummary?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken = default);
}
