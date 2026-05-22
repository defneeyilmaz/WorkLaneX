using Microsoft.Extensions.DependencyInjection;

namespace WorkLaneX.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // MediatR, FluentValidation, and handlers will be registered in later phases.
        return services;
    }
}
