using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Auth.Commands.Register;

public record RegisterCommand(string Email, string Password, string FullName)
    : IRequest<OperationResult<AuthResponse>>;
