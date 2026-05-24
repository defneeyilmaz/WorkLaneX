using Microsoft.EntityFrameworkCore;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Domain.Entities;

namespace WorkLaneX.Infrastructure.Persistence;

public class WorkLaneXDbContext : DbContext, IApplicationDbContext
{
    public WorkLaneXDbContext(DbContextOptions<WorkLaneXDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WorkLaneXDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
