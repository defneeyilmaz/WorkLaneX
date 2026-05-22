using Microsoft.AspNetCore.Mvc;

namespace WorkLaneX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "healthy",
            service = "WorkLaneX.Api",
            timestamp = DateTime.UtcNow
        });
    }
}
