using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Auth.Commands.Login;

public record LoginCommand(string Email, string Password)
    : IRequest<OperationResult<AuthResponse>>;
