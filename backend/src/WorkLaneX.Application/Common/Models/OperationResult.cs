namespace WorkLaneX.Application.Common.Models;

public class OperationResult<T>
{
    public bool Succeeded { get; init; }
    public T? Value { get; init; }
    public string? Error { get; init; }
    public IReadOnlyList<string> Errors { get; init; } = [];

    public static OperationResult<T> Success(T value) =>
        new() { Succeeded = true, Value = value };

    public static OperationResult<T> Failure(string error) =>
        new() { Succeeded = false, Error = error };

    public static OperationResult<T> Failure(IEnumerable<string> errors)
    {
        var list = errors.ToList();
        return new()
        {
            Succeeded = false,
            Error = list.FirstOrDefault(),
            Errors = list
        };
    }
}
