using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Application.Features.Projects.Commands.CreateProject;
using WorkLaneX.Application.Features.Projects.Queries.ListProjectsByWorkspace;
using WorkLaneX.Application.Features.Workspaces.Commands.AddWorkspaceMember;
using WorkLaneX.Application.Features.Workspaces.Commands.CreateWorkspace;
using WorkLaneX.Application.Features.Dashboard.Queries.GetWorkspaceDashboard;
using WorkLaneX.Application.Features.Workspaces.Queries.ListMyWorkspaces;
using WorkLaneX.Application.Features.Workspaces.Queries.ListWorkspaceMembers;
using WorkLaneX.Domain.Enums;

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

    [HttpGet("{workspaceId:guid}/dashboard")]
    public async Task<IActionResult> GetDashboard(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetWorkspaceDashboardQuery(workspaceId),
            cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpGet("{workspaceId:guid}/projects")]
    public async Task<IActionResult> ListProjects(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new ListProjectsByWorkspaceQuery(workspaceId),
            cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPost("{workspaceId:guid}/projects")]
    public async Task<IActionResult> CreateProject(
        Guid workspaceId,
        [FromBody] CreateProjectRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new CreateProjectCommand(workspaceId, request.Name, request.Description),
                cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Error?.Contains("permission", StringComparison.OrdinalIgnoreCase) == true
                    ? StatusCodes.Status403Forbidden
                    : result.Error?.Contains("access", StringComparison.OrdinalIgnoreCase) == true
                        ? StatusCodes.Status404NotFound
                        : StatusCodes.Status400BadRequest;
                return StatusCode(status, new { error = result.Error });
            }

            return CreatedAtAction(
                nameof(ListProjects),
                new { workspaceId },
                result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpGet("{workspaceId:guid}/members")]
    public async Task<IActionResult> ListMembers(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new ListWorkspaceMembersQuery(workspaceId),
            cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Error?.Contains("permission", StringComparison.OrdinalIgnoreCase) == true
                ? StatusCodes.Status403Forbidden
                : StatusCodes.Status404NotFound;
            return StatusCode(status, new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPost("{workspaceId:guid}/members")]
    public async Task<IActionResult> AddMember(
        Guid workspaceId,
        [FromBody] AddWorkspaceMemberRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new AddWorkspaceMemberCommand(workspaceId, request.Email, request.Role),
                cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Error?.Contains("permission", StringComparison.OrdinalIgnoreCase) == true
                    ? StatusCodes.Status403Forbidden
                    : StatusCodes.Status400BadRequest;
                return StatusCode(status, new { error = result.Error });
            }

            return CreatedAtAction(nameof(ListMembers), new { workspaceId }, result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }
}

public record CreateWorkspaceRequest(string Name, string? Description);

public record CreateProjectRequest(string Name, string? Description);

public record AddWorkspaceMemberRequest(string Email, WorkspaceRole Role = WorkspaceRole.Member);
