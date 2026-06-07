using WorkLaneX.Api.Hubs;
using WorkLaneX.Api.Services;
using WorkLaneX.Application.Common.Interfaces;

namespace WorkLaneX.Api.Extensions;

public static class SignalRExtensions
{
    public static IServiceCollection AddWorkLaneXSignalR(
        this IServiceCollection services,
        IHostEnvironment environment)
    {
        services.AddSignalR(options =>
        {
            options.EnableDetailedErrors = environment.IsDevelopment();
        });

        services.AddScoped<IProjectRealtimeNotifier, ProjectRealtimeNotifier>();

        return services;
    }

    public static WebApplication MapWorkLaneXHubs(this WebApplication app)
    {
        app.MapHub<ProjectHub>(ProjectHub.HubPath);
        return app;
    }
}
