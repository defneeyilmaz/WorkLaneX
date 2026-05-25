using MediatR;
using WorkLaneX.Application.Common.Models;

namespace WorkLaneX.Application.Features.Auth.Queries.GetCurrentUser;

public record GetCurrentUserQuery(Guid UserId) : IRequest<UserSummary?>;
