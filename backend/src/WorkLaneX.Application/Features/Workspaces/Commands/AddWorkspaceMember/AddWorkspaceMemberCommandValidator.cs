using FluentValidation;

namespace WorkLaneX.Application.Features.Workspaces.Commands.AddWorkspaceMember;

public class AddWorkspaceMemberCommandValidator : AbstractValidator<AddWorkspaceMemberCommand>
{
    public AddWorkspaceMemberCommandValidator()
    {
        RuleFor(x => x.WorkspaceId).NotEmpty();
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
    }
}
