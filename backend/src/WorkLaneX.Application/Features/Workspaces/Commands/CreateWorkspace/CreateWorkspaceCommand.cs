using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Workspaces.Commands.CreateWorkspace;

public record CreateWorkspaceCommand(string Name, string? Description)
    : IRequest<OperationResult<WorkspaceSummary>>;
