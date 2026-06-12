namespace WorkLaneX.Api.Extensions;

public static class CorsExtensions
{
    private static readonly string[] DevelopmentOrigins =
    [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ];

    public static IServiceCollection AddWorkLaneXCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        var configuredOrigins = configuration
            .GetSection("Cors:AllowedOrigins")
            .Get<string[]>();

        var origins = configuredOrigins is { Length: > 0 }
            ? configuredOrigins
            : environment.IsDevelopment()
                ? DevelopmentOrigins
                : [];

        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                if (origins.Length == 0)
                {
                    return;
                }

                policy.WithOrigins(origins)
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        return services;
    }
}
