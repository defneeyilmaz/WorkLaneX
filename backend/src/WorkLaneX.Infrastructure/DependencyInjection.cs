using Microsoft.Extensions.DependencyInjection;
using WorkLaneX.Application;

namespace WorkLaneX.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        _ = connectionString;
        services.AddApplication();
        // EF Core DbContext and external services will be registered in later phases.
        return services;
    }
}
