using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Application.Features.Tasks.Commands.CreateTask;
using WorkLaneX.Application.Features.Tasks.Commands.UpdateTask;
using WorkLaneX.Application.Features.Tasks.Commands.UpdateTaskStatus;
using WorkLaneX.Application.Features.Tasks.Queries.ListTasksByProject;
using WorkLaneX.Domain.Enums;
using TaskStatusEnum = WorkLaneX.Domain.Enums.TaskStatus;

namespace WorkLaneX.Api.Controllers;

[ApiController]
[Route("api/projects")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IMediator _mediator;

    public ProjectsController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpGet("{projectId:guid}/tasks")]
    public async Task<IActionResult> ListTasks(Guid projectId, CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ListTasksByProjectQuery(projectId), cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPost("{projectId:guid}/tasks")]
    public async Task<IActionResult> CreateTask(
        Guid projectId,
        [FromBody] CreateTaskRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new CreateTaskCommand(projectId, request.Title, request.Description, request.Priority),
                cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Error?.Contains("access", StringComparison.OrdinalIgnoreCase) == true
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status400BadRequest;
                return StatusCode(status, new { error = result.Error });
            }

            return CreatedAtAction(nameof(ListTasks), new { projectId }, result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpPatch("tasks/{taskId:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid taskId,
        [FromBody] UpdateTaskStatusRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new UpdateTaskStatusCommand(taskId, request.Status),
            cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPatch("tasks/{taskId:guid}")]
    public async Task<IActionResult> UpdateTask(
        Guid taskId,
        [FromBody] UpdateTaskRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new UpdateTaskCommand(
                    taskId,
                    request.Title,
                    request.Description,
                    request.Priority,
                    request.Status),
                cancellationToken);

            if (!result.Succeeded)
            {
                return NotFound(new { error = result.Error });
            }

            return Ok(result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }
}

public record CreateTaskRequest(string Title, string? Description, TaskPriority Priority = TaskPriority.Medium);
public record UpdateTaskStatusRequest(TaskStatusEnum Status);
public record UpdateTaskRequest(
    string Title,
    string? Description,
    TaskPriority Priority,
    TaskStatusEnum Status);
