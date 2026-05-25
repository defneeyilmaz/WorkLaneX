using MediatR;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Auth.Queries.GetCurrentUser;

public class GetCurrentUserQueryHandler : IRequestHandler<GetCurrentUserQuery, UserSummary?>
{
    private readonly IUserAccountService _userAccountService;

    public GetCurrentUserQueryHandler(IUserAccountService userAccountService)
    {
        _userAccountService = userAccountService;
    }

    public Task<UserSummary?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken) =>
        _userAccountService.GetUserByIdAsync(request.UserId, cancellationToken);
}
