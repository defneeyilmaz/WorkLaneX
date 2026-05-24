using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkLaneX.Application;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Infrastructure.Persistence;

namespace WorkLaneX.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddApplication();

        services.AddDbContext<WorkLaneXDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddScoped<IApplicationDbContext>(provider =>
            provider.GetRequiredService<WorkLaneXDbContext>());

        return services;
    }
}
