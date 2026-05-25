using MediatR;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Auth.Commands.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, OperationResult<AuthResponse>>
{
    private readonly IUserAccountService _userAccountService;

    public LoginCommandHandler(IUserAccountService userAccountService)
    {
        _userAccountService = userAccountService;
    }

    public Task<OperationResult<AuthResponse>> Handle(
        LoginCommand request,
        CancellationToken cancellationToken) =>
        _userAccountService.LoginAsync(request.Email, request.Password, cancellationToken);
}
