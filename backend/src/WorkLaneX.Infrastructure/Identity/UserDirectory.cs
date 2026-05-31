using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Infrastructure.Persistence;

namespace WorkLaneX.Infrastructure.Identity;

public class UserDirectory : IUserDirectory
{
    private readonly WorkLaneXDbContext _context;

    public UserDirectory(WorkLaneXDbContext context)
    {
        _context = context;
    }

    public async Task<UserSummary?> FindByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail, cancellationToken);

        return user is null
            ? null
            : new UserSummary(user.Id, user.Email!, user.FullName);
    }

    public async Task<IReadOnlyDictionary<Guid, string>> GetFullNamesAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, string>();
        }

        return await _context.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.FullName, cancellationToken);
    }

    public async Task<IReadOnlyDictionary<Guid, UserSummary>> GetUsersAsync(
        IEnumerable<Guid> userIds,
        CancellationToken cancellationToken = default)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return new Dictionary<Guid, UserSummary>();
        }

        return await _context.Users
            .AsNoTracking()
            .Where(u => ids.Contains(u.Id))
            .ToDictionaryAsync(
                u => u.Id,
                u => new UserSummary(u.Id, u.Email!, u.FullName),
                cancellationToken);
    }
}
