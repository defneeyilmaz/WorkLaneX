using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using WorkLaneX.Application;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Infrastructure.Identity;
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

        services
            .AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 8;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<WorkLaneXDbContext>()
            .AddDefaultTokenProviders();

        return services;
    }
}
