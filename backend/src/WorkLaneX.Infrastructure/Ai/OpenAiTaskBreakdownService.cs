using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using WorkLaneX.Application.Common.Interfaces;
using WorkLaneX.Application.Common.Models;
using WorkLaneX.Application.Common.Settings;
using WorkLaneX.Domain.Enums;

namespace WorkLaneX.Infrastructure.Ai;

public class OpenAiTaskBreakdownService : IAiTaskBreakdownService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly HttpClient _httpClient;
    private readonly OpenAiSettings _settings;
    private readonly ILogger<OpenAiTaskBreakdownService> _logger;

    public OpenAiTaskBreakdownService(
        HttpClient httpClient,
        IOptions<OpenAiSettings> settings,
        ILogger<OpenAiTaskBreakdownService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _logger = logger;
    }

    public async Task<(IReadOnlyList<SuggestedSubtaskSummary> Subtasks, bool UsedMockProvider)> BreakDownAsync(
        string taskTitle,
        string? taskDescription,
        int maxSubtasks,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.ApiKey))
        {
            return (BuildMockBreakdown(taskTitle, taskDescription, maxSubtasks), true);
        }

        var cappedMax = Math.Clamp(maxSubtasks, 3, 12);
        var userPrompt = BuildUserPrompt(taskTitle, taskDescription, cappedMax);

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://api.openai.com/v1/chat/completions");

        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        request.Content = JsonContent.Create(new
        {
            model = _settings.Model,
            temperature = 0.4,
            response_format = new { type = "json_object" },
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content =
                        "You break software team tasks into actionable subtasks. " +
                        "Respond with JSON only: {\"subtasks\":[{\"title\":\"...\",\"description\":\"...\",\"priority\":\"Low|Medium|High|Urgent\"}]}. " +
                        "Keep titles short. Descriptions are one sentence. " +
                        "Order subtasks from discovery to delivery.",
                },
                new { role = "user", content = userPrompt },
            },
        });

        using var response = await _httpClient.SendAsync(request, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning(
                "OpenAI breakdown failed with status {Status}: {Body}",
                (int)response.StatusCode,
                body);
            throw new InvalidOperationException("OpenAI request failed.");
        }

        var payload = await response.Content.ReadFromJsonAsync<ChatCompletionResponse>(
            JsonOptions,
            cancellationToken);

        var content = payload?.Choices?.FirstOrDefault()?.Message?.Content;
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("OpenAI returned an empty response.");
        }

        var parsed = JsonSerializer.Deserialize<BreakdownResponse>(content, JsonOptions);
        var subtasks = MapSubtasks(parsed?.Subtasks, cappedMax);

        if (subtasks.Count == 0)
        {
            throw new InvalidOperationException("OpenAI returned no subtasks.");
        }

        return (subtasks, false);
    }

    private static string BuildUserPrompt(string title, string? description, int maxSubtasks)
    {
        var descriptionLine = string.IsNullOrWhiteSpace(description)
            ? "No extra description."
            : description.Trim();

        return
            $"Break this task into {maxSubtasks} or fewer subtasks.\n" +
            $"Title: {title.Trim()}\n" +
            $"Description: {descriptionLine}";
    }

    private static IReadOnlyList<SuggestedSubtaskSummary> MapSubtasks(
        IEnumerable<RawSubtask>? rawSubtasks,
        int maxSubtasks)
    {
        if (rawSubtasks is null)
        {
            return [];
        }

        return rawSubtasks
            .Where(s => !string.IsNullOrWhiteSpace(s.Title))
            .Take(maxSubtasks)
            .Select(s => new SuggestedSubtaskSummary(
                s.Title.Trim(),
                string.IsNullOrWhiteSpace(s.Description) ? null : s.Description.Trim(),
                ParsePriority(s.Priority)))
            .ToList();
    }

    private static TaskPriority ParsePriority(string? priority)
    {
        return priority?.Trim().ToLowerInvariant() switch
        {
            "low" => TaskPriority.Low,
            "high" => TaskPriority.High,
            "urgent" => TaskPriority.Urgent,
            _ => TaskPriority.Medium,
        };
    }

    private static IReadOnlyList<SuggestedSubtaskSummary> BuildMockBreakdown(
        string taskTitle,
        string? taskDescription,
        int maxSubtasks)
    {
        var context = string.IsNullOrWhiteSpace(taskDescription)
            ? taskTitle
            : $"{taskTitle} — {taskDescription.Trim()}";

        var templates = new[]
        {
            new SuggestedSubtaskSummary(
                "Clarify scope and acceptance criteria",
                $"Define done for: {context}",
                TaskPriority.High),
            new SuggestedSubtaskSummary(
                "Identify dependencies and risks",
                "List blockers, owners, and external systems.",
                TaskPriority.Medium),
            new SuggestedSubtaskSummary(
                "Implement core workflow",
                "Build the main path for the feature or fix.",
                TaskPriority.High),
            new SuggestedSubtaskSummary(
                "Add validation and error handling",
                "Cover edge cases and user-facing failures.",
                TaskPriority.Medium),
            new SuggestedSubtaskSummary(
                "Write tests and verify manually",
                "Add or update tests and run a quick demo pass.",
                TaskPriority.Medium),
            new SuggestedSubtaskSummary(
                "Update docs and handoff notes",
                "Capture decisions for the team in docs or comments.",
                TaskPriority.Low),
        };

        return templates.Take(Math.Clamp(maxSubtasks, 3, templates.Length)).ToList();
    }

    private sealed class ChatCompletionResponse
    {
        public List<ChatChoice>? Choices { get; set; }
    }

    private sealed class ChatChoice
    {
        public ChatMessage? Message { get; set; }
    }

    private sealed class ChatMessage
    {
        public string? Content { get; set; }
    }

    private sealed class BreakdownResponse
    {
        [JsonPropertyName("subtasks")]
        public List<RawSubtask>? Subtasks { get; set; }
    }

    private sealed class RawSubtask
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Priority { get; set; }
    }
}
