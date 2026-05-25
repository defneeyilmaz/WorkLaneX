using MediatR;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Auth.Commands.Register;

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, OperationResult<AuthResponse>>
{
    private readonly IUserAccountService _userAccountService;

    public RegisterCommandHandler(IUserAccountService userAccountService)
    {
        _userAccountService = userAccountService;
    }

    public Task<OperationResult<AuthResponse>> Handle(
        RegisterCommand request,
        CancellationToken cancellationToken) =>
        _userAccountService.RegisterAsync(
            request.Email,
            request.Password,
            request.FullName,
            cancellationToken);
}
