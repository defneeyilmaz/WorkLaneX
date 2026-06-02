using FluentValidation;

namespace WorkLaneX.Application.Features.Tasks.Commands.AddTaskComment;

public class AddTaskCommentCommandValidator : AbstractValidator<AddTaskCommentCommand>
{
    public AddTaskCommentCommandValidator()
    {
        RuleFor(x => x.TaskId).NotEmpty();

        RuleFor(x => x.Body)
            .NotEmpty()
            .MaximumLength(2000);
    }
}
