using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using SmartCityPoc.Shared;
using Temporalio.Activities;

namespace SmartCityPoc.Worker.Domains.FireDispatch;

public class FireDetectionActivities
{
    private static readonly HttpClient s_httpClient = new();

    private readonly ILogger<FireDetectionActivities> _logger;

    public FireDetectionActivities(ILogger<FireDetectionActivities> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// BRE step: deterministic, hardcoded rule check. Escalates a confidence-based
    /// base severity for night hours and residential/industrial zones. This is a
    /// guardrail, not a decision-maker — the workflow still requires human approval
    /// regardless of the computed severity.
    /// </summary>
    [Activity]
    public Task<BreResult> EvaluateBreAsync(FireEvent fireEvent)
    {
        var severities = new[] { "Low", "Medium", "High", "Critical" };
        var severityIndex = fireEvent.Confidence switch
        {
            >= 0.85 => 3,
            >= 0.6 => 2,
            >= 0.35 => 1,
            _ => 0,
        };

        var reasons = new List<string> { $"Base severity '{severities[severityIndex]}' from confidence {fireEvent.Confidence:F2}." };

        var occurredAt = fireEvent.DetectedAtUtc ?? DateTimeOffset.UtcNow;
        var isNightHours = occurredAt.UtcDateTime.Hour is >= 22 or < 6;
        if (isNightHours && severityIndex < severities.Length - 1)
        {
            severityIndex++;
            reasons.Add($"Escalated one level: reported at {occurredAt.UtcDateTime:HH:mm} UTC (night hours).");
        }

        var zone = fireEvent.Zone?.Trim();
        var isSensitiveZone = zone is not null &&
            (zone.Equals("Residential", StringComparison.OrdinalIgnoreCase) ||
             zone.Equals("Industrial", StringComparison.OrdinalIgnoreCase));
        if (isSensitiveZone && severityIndex < severities.Length - 1)
        {
            severityIndex++;
            reasons.Add($"Escalated one level: zone '{zone}' is sensitive.");
        }

        var result = new BreResult(severities[severityIndex], RequiresHumanApproval: true, string.Join(' ', reasons));
        _logger.LogInformation("BRE evaluated fire event at {Location}: {Severity} ({Reasoning})", fireEvent.Location, result.Severity, result.Reasoning);
        return Task.FromResult(result);
    }

    /// <summary>
    /// Versioning demo (see FireDetectionWorkflow's Workflow.Patched("add-incident-audit-log")
    /// call). Added after some fire workflows may already be running — only reached by
    /// workflow executions whose history proves they started after this code shipped.
    /// </summary>
    [Activity]
    public Task<string> LogIncidentForAuditAsync(FireEvent fireEvent, BreResult bre)
    {
        var message = $"[AUDIT] Incident logged for compliance: '{fireEvent.Location}', severity '{bre.Severity}'.";
        _logger.LogInformation("{Message}", message);
        return Task.FromResult(message);
    }

    /// <summary>
    /// MOCK ONLY. This activity never contacts a real emergency service — it only
    /// logs a simulated dispatch call. Do not wire this to any real telephony or
    /// emergency-services API.
    /// </summary>
    [Activity]
    public Task<CallFireDeptResult> CallFireDepartmentMockAsync(FireEvent fireEvent, BreResult bre)
    {
        var message = $"[MOCK — NOT A REAL CALL] Simulated dispatch to fire department for '{fireEvent.Location}' " +
                      $"at severity '{bre.Severity}'. No real emergency service was contacted.";
        _logger.LogWarning("{Message}", message);
        return Task.FromResult(new CallFireDeptResult(Success: true, message, DateTimeOffset.UtcNow));
    }

    /// <summary>
    /// Drafts a resident notification. Uses a hardcoded template by default; if
    /// ANTHROPIC_API_KEY is set, calls the Claude API to draft the text instead
    /// (mirrors the platform's "Copilot" capability). The actual send is always
    /// mocked — no message is ever delivered to a real resident.
    /// </summary>
    [Activity]
    public async Task<ResidentNotificationResult> NotifyResidentsAsync(FireEvent fireEvent, BreResult bre)
    {
        var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY");
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            var templateMessage = BuildTemplateMessage(fireEvent, bre);
            _logger.LogInformation("[MOCK SEND] Notifying residents (template): {Message}", templateMessage);
            return new ResidentNotificationResult(Sent: true, templateMessage, Source: "template");
        }

        try
        {
            var draftedMessage = await DraftViaClaudeAsync(fireEvent, bre, apiKey);
            _logger.LogInformation("[MOCK SEND] Notifying residents (Claude API draft): {Message}", draftedMessage);
            return new ResidentNotificationResult(Sent: true, draftedMessage, Source: "claude-api");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Claude API draft failed, falling back to template.");
            var fallbackMessage = BuildTemplateMessage(fireEvent, bre);
            return new ResidentNotificationResult(Sent: true, fallbackMessage, Source: "template");
        }
    }

    private static string BuildTemplateMessage(FireEvent fireEvent, BreResult bre) =>
        $"Fire reported near {fireEvent.Location} (severity: {bre.Severity}). " +
        "Emergency services have been notified. Please avoid the area and follow instructions from local authorities.";

    private static async Task<string> DraftViaClaudeAsync(FireEvent fireEvent, BreResult bre, string apiKey)
    {
        var prompt =
            $"Draft a short (2-3 sentence) public safety notification for residents near {fireEvent.Location}. " +
            $"Severity: {bre.Severity}. Keep it calm, factual, and actionable. No hashtags, no emoji.";

        var requestBody = new
        {
            model = "claude-haiku-4-5",
            max_tokens = 300,
            messages = new[] { new { role = "user", content = prompt } },
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
        {
            Content = JsonContent.Create(requestBody),
        };
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");

        using var response = await s_httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        var text = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString();

        return string.IsNullOrWhiteSpace(text) ? BuildTemplateMessage(fireEvent, bre) : text.Trim();
    }
}
