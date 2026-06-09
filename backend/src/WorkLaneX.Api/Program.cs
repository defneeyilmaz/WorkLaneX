using System.Text.Json.Serialization;
using WorkLaneX.Api.Extensions;
using WorkLaneX.Infrastructure;
using WorkLaneX.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:3001",
                "http://127.0.0.1:3001")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Port=5433;Database=worklanex;Username=postgres;Password=postgres";

builder.Services.AddInfrastructure(connectionString, builder.Configuration);
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddWorkLaneXSignalR(builder.Environment);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapWorkLaneXHubs();

await ApplicationDatabaseSeeder.SeedDevelopmentDataAsync(app.Services);

app.Run();
