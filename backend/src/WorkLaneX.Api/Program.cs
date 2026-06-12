using System.Text.Json.Serialization;
using Microsoft.AspNetCore.HttpOverrides;
using WorkLaneX.Api.Extensions;
using WorkLaneX.Infrastructure;
using WorkLaneX.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://+:{port}");
}

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddWorkLaneXCors(builder.Configuration, builder.Environment);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5433;Database=worklanex;Username=postgres;Password=postgres";

builder.Services.AddInfrastructure(connectionString, builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddWorkLaneXSignalR(builder.Environment);

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseForwardedHeaders();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapWorkLaneXHubs();

await ApplicationDatabaseSeeder.SeedDevelopmentDataAsync(app.Services);

app.Run();
