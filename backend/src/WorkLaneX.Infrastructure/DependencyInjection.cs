using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WorkLaneX.Application;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Settings;
using WorkLaneX.Infrastructure.Ai;
using WorkLaneX.Infrastructure.Auth;
using WorkLaneX.Infrastructure.Identity;
using WorkLaneX.Infrastructure.Persistence;
using WorkLaneX.Infrastructure.Services;

namespace WorkLaneX.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString,
        IConfiguration configuration)
    {
        services.AddApplication();

        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));
        services.Configure<OpenAiSettings>(configuration.GetSection(OpenAiSettings.SectionName));

        services.AddHttpClient<IAiTaskBreakdownService, OpenAiTaskBreakdownService>((sp, client) =>
        {
            var settings = sp.GetRequiredService<
                Microsoft.Extensions.Options.IOptions<OpenAiSettings>>().Value;
            client.Timeout = TimeSpan.FromSeconds(Math.Clamp(settings.TimeoutSeconds, 10, 60));
        });

        services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<IUserAccountService, UserAccountService>();
        services.AddScoped<IUserDirectory, UserDirectory>();
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

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
