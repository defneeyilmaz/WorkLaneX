using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Application.Features.Workspaces.Commands.CreateWorkspace;
using WorkLaneX.Application.Features.Workspaces.Queries.ListMyWorkspaces;

namespace WorkLaneX.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController : ControllerBase
{
    private readonly IMediator _mediator;

    public WorkspacesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var workspaces = await _mediator.Send(new ListMyWorkspacesQuery(), cancellationToken);
        return Ok(workspaces);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new CreateWorkspaceCommand(request.Name, request.Description),
                cancellationToken);

            if (!result.Succeeded)
            {
                return BadRequest(new { error = result.Error });
            }

            return CreatedAtAction(nameof(List), new { id = result.Value!.Id }, result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }
}

public record CreateWorkspaceRequest(string Name, string? Description);
