using FluentValidation;

namespace WorkLaneX.Application.Features.Documents.Commands.UpdateProjectDocument;

public class UpdateProjectDocumentCommandValidator : AbstractValidator<UpdateProjectDocumentCommand>
{
    public UpdateProjectDocumentCommandValidator()
    {
        RuleFor(x => x.DocumentId).NotEmpty();

        RuleFor(x => x.Title)
            .MaximumLength(200)
            .When(x => x.Title is not null);

        RuleFor(x => x)
            .Must(x => x.Title is not null || x.Content is not null)
            .WithMessage("At least one field must be provided.");
    }
}
