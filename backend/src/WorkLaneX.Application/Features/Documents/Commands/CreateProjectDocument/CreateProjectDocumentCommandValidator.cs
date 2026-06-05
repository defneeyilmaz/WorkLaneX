using FluentValidation;

namespace WorkLaneX.Application.Features.Documents.Commands.CreateProjectDocument;

public class CreateProjectDocumentCommandValidator : AbstractValidator<CreateProjectDocumentCommand>
{
    public CreateProjectDocumentCommandValidator()
    {
        RuleFor(x => x.ProjectId).NotEmpty();

        RuleFor(x => x.Title)
            .NotEmpty()
            .MaximumLength(200);
    }
}
