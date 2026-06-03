using Microsoft.EntityFrameworkCore;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<Workspace> Workspaces { get; }
    DbSet<WorkspaceMember> WorkspaceMembers { get; }
    DbSet<Project> Projects { get; }
    DbSet<TaskItem> TaskItems { get; }
    DbSet<TaskComment> TaskComments { get; }
    DbSet<ActivityLog> ActivityLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
