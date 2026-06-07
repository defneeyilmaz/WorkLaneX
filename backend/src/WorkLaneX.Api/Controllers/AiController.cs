using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Application.Features.Ai.Commands.BreakDownTask;

namespace WorkLaneX.Api.Controllers;

[ApiController]
[Route("api/ai")]
[Authorize]
public class AiController : ControllerBase
{
    private readonly IMediator _mediator;

    public AiController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost("tasks/{taskId:guid}/breakdown")]
    public async Task<IActionResult> BreakDownTask(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new BreakDownTaskCommand(taskId), cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Error?.Contains("access", StringComparison.OrdinalIgnoreCase) == true
                ? StatusCodes.Status404NotFound
                : StatusCodes.Status400BadRequest;
            return StatusCode(status, new { error = result.Error });
        }

        return Ok(result.Value);
    }
}
