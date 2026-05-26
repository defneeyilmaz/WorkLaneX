using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Settings;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Infrastructure.Identity;

public class UserAccountService : IUserAccountService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IApplicationDbContext _context;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly JwtSettings _jwtSettings;

    public UserAccountService(
        UserManager<ApplicationUser> userManager,
        IApplicationDbContext context,
        IJwtTokenGenerator jwtTokenGenerator,
        IOptions<JwtSettings> jwtSettings)
    {
        _userManager = userManager;
        _context = context;
        _jwtTokenGenerator = jwtTokenGenerator;
        _jwtSettings = jwtSettings.Value;
    }

    public async Task<OperationResult<AuthResponse>> RegisterAsync(
        string email,
        string password,
        string fullName,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            UserName = normalizedEmail,
            FullName = fullName.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, password);

        if (!result.Succeeded)
        {
            return OperationResult<AuthResponse>.Failure(
                result.Errors.Select(e => e.Description));
        }

        await CreateDefaultWorkspaceAsync(user, cancellationToken);

        return OperationResult<AuthResponse>.Success(BuildAuthResponse(user));
    }

    public async Task<OperationResult<AuthResponse>> LoginAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByEmailAsync(email.Trim().ToLowerInvariant());

        if (user is null)
        {
            return OperationResult<AuthResponse>.Failure("Invalid email or password.");
        }

        var passwordValid = await _userManager.CheckPasswordAsync(user, password);

        if (!passwordValid)
        {
            return OperationResult<AuthResponse>.Failure("Invalid email or password.");
        }

        return OperationResult<AuthResponse>.Success(BuildAuthResponse(user));
    }

    public async Task<UserSummary?> GetUserByIdAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        return user is null ? null : ToUserSummary(user);
    }

    private AuthResponse BuildAuthResponse(ApplicationUser user)
    {
        var token = _jwtTokenGenerator.GenerateToken(user.Id, user.Email!, user.FullName);

        return new AuthResponse(
            token,
            _jwtSettings.ExpirationMinutes,
            ToUserSummary(user));
    }

    private static UserSummary ToUserSummary(ApplicationUser user) =>
        new(user.Id, user.Email!, user.FullName);

    private async Task CreateDefaultWorkspaceAsync(
        ApplicationUser user,
        CancellationToken cancellationToken)
    {
        var workspace = new Workspace
        {
            Name = $"{user.FullName.Trim()}'s workspace",
            OwnerId = user.Id,
        };

        var membership = new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = user.Id,
            Role = WorkspaceRole.Owner,
        };

        _context.Workspaces.Add(workspace);
        _context.WorkspaceMembers.Add(membership);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
