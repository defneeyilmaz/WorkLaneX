using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WorkLaneX.Application.Features.Documents.Commands.CreateProjectDocument;
using WorkLaneX.Application.Features.Documents.Commands.DeleteProjectDocument;
using WorkLaneX.Application.Features.Documents.Commands.UpdateProjectDocument;
using WorkLaneX.Application.Features.Documents.Queries.GetProjectDocument;
using WorkLaneX.Application.Features.Documents.Queries.ListProjectDocuments;
using WorkLaneX.Application.Features.Tasks.Commands.AddTaskComment;
using WorkLaneX.Application.Features.Tasks.Commands.ApproveTask;
using WorkLaneX.Application.Features.Tasks.Commands.CreateTask;
using WorkLaneX.Application.Features.Tasks.Commands.RejectTask;
using WorkLaneX.Application.Features.Tasks.Commands.MoveTask;
using WorkLaneX.Application.Features.Tasks.Commands.UpdateTask;
using WorkLaneX.Application.Features.Tasks.Commands.UpdateTaskStatus;
using WorkLaneX.Application.Features.Tasks.Queries.ListTaskActivity;
using WorkLaneX.Application.Features.Tasks.Queries.ListTaskComments;
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
                new CreateTaskCommand(
                    projectId,
                    request.Title,
                    request.Description,
                    request.Priority,
                    request.AssigneeId),
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
            new UpdateTaskStatusCommand(taskId, request.Status, request.CompletionNote),
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

    [HttpPatch("tasks/{taskId:guid}/move")]
    public async Task<IActionResult> MoveTask(
        Guid taskId,
        [FromBody] MoveTaskRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new MoveTaskCommand(taskId, request.Status, request.SortOrder),
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
                    request.Status,
                    request.AssigneeId,
                    request.CompletionNote),
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
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpPost("tasks/{taskId:guid}/approve")]
    public async Task<IActionResult> ApproveTask(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ApproveTaskCommand(taskId), cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Error?.Contains("permission", StringComparison.OrdinalIgnoreCase) == true
                ? StatusCodes.Status403Forbidden
                : StatusCodes.Status404NotFound;
            return StatusCode(status, new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpGet("tasks/{taskId:guid}/activity")]
    public async Task<IActionResult> ListTaskActivity(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ListTaskActivityQuery(taskId), cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpGet("tasks/{taskId:guid}/comments")]
    public async Task<IActionResult> ListTaskComments(
        Guid taskId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(new ListTaskCommentsQuery(taskId), cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPost("tasks/{taskId:guid}/comments")]
    public async Task<IActionResult> AddTaskComment(
        Guid taskId,
        [FromBody] AddTaskCommentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new AddTaskCommentCommand(taskId, request.Body),
                cancellationToken);

            if (!result.Succeeded)
            {
                return NotFound(new { error = result.Error });
            }

            return CreatedAtAction(nameof(ListTaskComments), new { taskId }, result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpPost("tasks/{taskId:guid}/reject")]
    public async Task<IActionResult> RejectTask(
        Guid taskId,
        [FromBody] RejectTaskRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new RejectTaskCommand(taskId, request.RejectionNote),
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
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpGet("{projectId:guid}/documents")]
    public async Task<IActionResult> ListDocuments(
        Guid projectId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new ListProjectDocumentsQuery(projectId),
            cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpGet("documents/{documentId:guid}")]
    public async Task<IActionResult> GetDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new GetProjectDocumentQuery(documentId),
            cancellationToken);

        if (!result.Succeeded)
        {
            return NotFound(new { error = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpPost("{projectId:guid}/documents")]
    public async Task<IActionResult> CreateDocument(
        Guid projectId,
        [FromBody] CreateProjectDocumentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new CreateProjectDocumentCommand(projectId, request.Title, request.Content),
                cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Error?.Contains("access", StringComparison.OrdinalIgnoreCase) == true
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status400BadRequest;
                return StatusCode(status, new { error = result.Error });
            }

            return CreatedAtAction(
                nameof(GetDocument),
                new { documentId = result.Value!.Id },
                result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpPatch("documents/{documentId:guid}")]
    public async Task<IActionResult> UpdateDocument(
        Guid documentId,
        [FromBody] UpdateProjectDocumentRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _mediator.Send(
                new UpdateProjectDocumentCommand(documentId, request.Title, request.Content),
                cancellationToken);

            if (!result.Succeeded)
            {
                var status = result.Error?.Contains("access", StringComparison.OrdinalIgnoreCase) == true
                    ? StatusCodes.Status404NotFound
                    : StatusCodes.Status400BadRequest;
                return StatusCode(status, new { error = result.Error });
            }

            return Ok(result.Value);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { errors = ex.Errors.Select(e => e.ErrorMessage) });
        }
    }

    [HttpDelete("documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var result = await _mediator.Send(
            new DeleteProjectDocumentCommand(documentId),
            cancellationToken);

        if (!result.Succeeded)
        {
            var status = result.Error?.Contains("permission", StringComparison.OrdinalIgnoreCase) == true
                ? StatusCodes.Status403Forbidden
                : StatusCodes.Status404NotFound;
            return StatusCode(status, new { error = result.Error });
        }

        return NoContent();
    }
}

public record CreateTaskRequest(
    string Title,
    string? Description,
    TaskPriority Priority = TaskPriority.Medium,
    Guid? AssigneeId = null);

public record UpdateTaskStatusRequest(
    TaskStatusEnum Status,
    string? CompletionNote = null);

public record MoveTaskRequest(TaskStatusEnum Status, int SortOrder);

public record UpdateTaskRequest(
    string Title,
    string? Description,
    TaskPriority Priority,
    TaskStatusEnum Status,
    Guid? AssigneeId = null,
    string? CompletionNote = null);

public record RejectTaskRequest(string RejectionNote);

public record AddTaskCommentRequest(string Body);

public record CreateProjectDocumentRequest(string Title, string? Content = null);

public record UpdateProjectDocumentRequest(string? Title = null, string? Content = null);
