using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WorkLaneX.Domain.Entities;
using WorkLaneX.Domain.Enums;
using WorkLaneX.Infrastructure.Identity;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Infrastructure.Persistence;

public static class ApplicationDatabaseSeeder
{
    public const string DemoEmail = "defne.demo@worklanex.com";
    public const string DemoPassword = "admin123";

    public static async Task ApplyMigrationsAsync(
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        await using var scope = services.CreateAsyncScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<WorkLaneXDbContext>>();
        var context = scope.ServiceProvider.GetRequiredService<WorkLaneXDbContext>();

        await context.Database.MigrateAsync(cancellationToken);
        logger.LogInformation("Database migrations applied.");
    }

    public static async Task SeedDevelopmentDataAsync(
        IServiceProvider services,
        CancellationToken cancellationToken = default)
    {
        var environment = services.GetRequiredService<IHostEnvironment>();
        if (!environment.IsDevelopment())
        {
            return;
        }

        await using var scope = services.CreateAsyncScope();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<WorkLaneXDbContext>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var context = scope.ServiceProvider.GetRequiredService<WorkLaneXDbContext>();

        if (await userManager.FindByEmailAsync(DemoEmail) is not null)
        {
            logger.LogInformation("Demo seed skipped — user {Email} already exists.", DemoEmail);
            return;
        }

        var demoUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            Email = DemoEmail,
            UserName = DemoEmail,
            FullName = "Defne Demo",
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow,
        };

        var createResult = await userManager.CreateAsync(demoUser, DemoPassword);
        if (!createResult.Succeeded)
        {
            var errors = string.Join(", ", createResult.Errors.Select(error => error.Description));
            logger.LogWarning("Demo seed failed to create user: {Errors}", errors);
            return;
        }

        var workspace = new Workspace
        {
            Name = "WorkLaneX Demo",
            Description = "Sample workspace with projects, tasks, and docs for local demos.",
            OwnerId = demoUser.Id,
        };

        var membership = new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = demoUser.Id,
            Role = WorkspaceRole.Owner,
        };

        var project = new Project
        {
            WorkspaceId = workspace.Id,
            Name = "MVP Launch",
            Description = "First public release scope for the WorkLaneX workspace.",
        };

        var tasks = new[]
        {
            new TaskItem
            {
                ProjectId = project.Id,
                Title = "Design onboarding flow",
                Description = "Map the first-run experience from sign-up to the first task on the board.",
                Status = TaskStatusEnum.ToDo,
                SortOrder = 1000,
                Priority = TaskPriority.High,
            },
            new TaskItem
            {
                ProjectId = project.Id,
                Title = "Set up CI pipeline",
                Description = "Run backend and frontend builds on every pull request.",
                Status = TaskStatusEnum.InProgress,
                SortOrder = 2000,
                Priority = TaskPriority.Medium,
                AssigneeId = demoUser.Id,
            },
            new TaskItem
            {
                ProjectId = project.Id,
                Title = "Write API documentation",
                Description = "Document auth, workspaces, projects, tasks, and dashboard endpoints.",
                Status = TaskStatusEnum.Review,
                SortOrder = 3000,
                Priority = TaskPriority.Low,
                AssigneeId = demoUser.Id,
            },
            new TaskItem
            {
                ProjectId = project.Id,
                Title = "Polish landing page",
                Description = "Refresh hero copy, feature highlights, and demo credentials callout.",
                Status = TaskStatusEnum.Done,
                SortOrder = 4000,
                Priority = TaskPriority.Medium,
                AssigneeId = demoUser.Id,
                CompletionNote = "Updated landing layout and health status section.",
            },
            new TaskItem
            {
                ProjectId = project.Id,
                Title = "Connect SignalR live updates",
                Description = "Refresh the kanban board when teammates move tasks.",
                Status = TaskStatusEnum.InProgress,
                SortOrder = 5000,
                Priority = TaskPriority.High,
            },
            new TaskItem
            {
                ProjectId = project.Id,
                Title = "Add dashboard summary cards",
                Description = "Show overdue work, active projects, and recent activity.",
                Status = TaskStatusEnum.ToDo,
                SortOrder = 6000,
                Priority = TaskPriority.Medium,
            },
        };

        var document = new ProjectDocument
        {
            ProjectId = project.Id,
            AuthorId = demoUser.Id,
            Title = "Release checklist",
            Content =
                "# MVP launch checklist\n\n" +
                "- [x] Auth and workspace flows\n" +
                "- [x] Kanban board with drag and drop\n" +
                "- [ ] Dashboard polish\n" +
                "- [ ] Deploy demo environment\n\n" +
                "Use this doc to track release readiness with the team.",
        };

        context.Workspaces.Add(workspace);
        context.WorkspaceMembers.Add(membership);
        context.Projects.Add(project);
        context.TaskItems.AddRange(tasks);
        context.ProjectDocuments.Add(document);

        var pipelineTask = tasks[1];
        context.TaskComments.Add(new TaskComment
        {
            TaskId = pipelineTask.Id,
            AuthorId = demoUser.Id,
            Body = "GitHub Actions workflow is in place — next step is caching NuGet packages.",
        });

        var now = DateTime.UtcNow;
        context.ActivityLogs.AddRange(
            CreateActivity(workspace.Id, project.Id, tasks[0].Id, demoUser.Id,
                ActivityActionType.TaskCreated, "created this task", now.AddMinutes(-120)),
            CreateActivity(workspace.Id, project.Id, pipelineTask.Id, demoUser.Id,
                ActivityActionType.TaskStatusChanged, "moved task to In Progress", now.AddMinutes(-90)),
            CreateActivity(workspace.Id, project.Id, pipelineTask.Id, demoUser.Id,
                ActivityActionType.TaskCommentAdded, "left a comment", now.AddMinutes(-75)),
            CreateActivity(workspace.Id, project.Id, tasks[3].Id, demoUser.Id,
                ActivityActionType.TaskStatusChanged, "marked task as Done", now.AddMinutes(-30)));

        await context.SaveChangesAsync(cancellationToken);

        logger.LogInformation(
            "Seeded demo workspace for {Email} with project {ProjectName}.",
            DemoEmail,
            project.Name);
    }

    private static ActivityLog CreateActivity(
        Guid workspaceId,
        Guid projectId,
        Guid taskId,
        Guid actorId,
        ActivityActionType action,
        string detail,
        DateTime createdAt)
    {
        return new ActivityLog
        {
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            TaskId = taskId,
            ActorId = actorId,
            Action = action,
            Detail = detail,
            CreatedAt = createdAt,
        };
    }
}
