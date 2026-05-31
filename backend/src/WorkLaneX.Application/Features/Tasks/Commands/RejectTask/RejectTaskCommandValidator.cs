using FluentValidation;

namespace WorkLaneX.Application.Features.Tasks.Commands.RejectTask;

public class RejectTaskCommandValidator : AbstractValidator<RejectTaskCommand>
{
    public RejectTaskCommandValidator()
    {
        RuleFor(x => x.TaskId).NotEmpty();
        RuleFor(x => x.RejectionNote).NotEmpty().MaximumLength(2000);
    }
}
