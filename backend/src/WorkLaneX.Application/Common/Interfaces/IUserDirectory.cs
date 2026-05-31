using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Common.Interfaces;

public interface IUserDirectory
{
    Task<UserSummary?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<Guid, UserSummary>> GetUsersAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default);
}
