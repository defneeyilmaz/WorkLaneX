using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Infrastructure.Persistence;

namespace WorkLaneX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly WorkLaneXDbContext _dbContext;

    public HealthController(WorkLaneXDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var canConnect = false;

        try
        {
            canConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch
        {
            canConnect = false;
        }

        var status = canConnect ? "healthy" : "degraded";

        return Ok(new
        {
            status,
            service = "WorkLaneX.Api",
            database = canConnect ? "connected" : "unavailable",
            timestamp = DateTime.UtcNow
        });
    }
}
