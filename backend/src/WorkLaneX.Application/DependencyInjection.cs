using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using WorkLaneX.Application.Common.Behaviors;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Services;

namespace WorkLaneX.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        services.AddScoped<IWorkspaceAuthorizationService, WorkspaceAuthorizationService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();

        return services;
    }
}
