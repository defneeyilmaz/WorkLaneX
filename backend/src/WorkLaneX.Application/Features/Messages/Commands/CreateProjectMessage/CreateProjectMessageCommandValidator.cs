using FluentValidation;

namespace WorkLaneX.Application.Features.Messages.Commands.CreateProjectMessage;

public class CreateProjectMessageCommandValidator : AbstractValidator<CreateProjectMessageCommand>
{
    public CreateProjectMessageCommandValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.Body)
            .NotEmpty()
            .MaximumLength(2000);
    }
}
