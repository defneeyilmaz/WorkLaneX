namespace WorkLaneX.Application.Common.Settings;

public class OpenAiSettings
{
    public const string SectionName = "OpenAi";

    public string? ApiKey { get; set; }

    public string Model { get; set; } = "gpt-4o-mini";

    public int MaxSubtasks { get; set; } = 8;

    public int TimeoutSeconds { get; set; } = 30;
}
