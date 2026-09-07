using Microsoft.Extensions.Logging;
using Temporalio.Activities;
using Temporalio.Exceptions;

namespace SmartCityPoc.Worker.Domains.PotholeReport;

public class PotholeActivities
{
    // Demo-only pacing: these mock activities do no real work, so they'd
    // otherwise complete within milliseconds of each other — too fast for
    // the workflow-editor's live-status polling to ever observe. A real
    // activity's own I/O latency would naturally provide this; this delay
    // exists purely so the pipeline's progress is visible, not to simulate
    // realistic timing.
    private static readonly TimeSpan DemoStepDelay = TimeSpan.FromSeconds(2);

    private readonly ILogger<PotholeActivities> _logger;

    public PotholeActivities(ILogger<PotholeActivities> logger)
    {
        _logger = logger;
    }

    [Activity]
    public async Task<string> LogPotholeAsync(string street)
    {
        var message = $"Pothole reported on {street}. Logged for repair crew.";
        _logger.LogInformation("{Message}", message);
        await Task.Delay(DemoStepDelay);
        return message;
    }

    // Generic dispatch for every step the interpreter workflow (PotholeWorkflow)
    // can run — the switch is the one place that still needs a code change to
    // teach the system a brand-new *activity behavior*. Wait-kind steps (e.g.
    // "repairWait", "approval") never reach this method — the workflow handles
    // those itself via WaitConditionAsync.
    [Activity]
    public async Task<string> ExecuteStepAsync(string stepType, string street, Dictionary<string, string> properties, string? previousResult)
    {
        string result;
        switch (stepType)
        {
            case "assessSeverity":
                var severity = street.Length > 10 ? "Major" : "Minor";
                _logger.LogInformation("Pothole on {Street} assessed as '{Severity}' severity.", street, severity);
                result = severity;
                break;

            case "notifyUtility":
                // Retry-policy demo: deliberately fails on the first two attempts and
                // succeeds on the third. Uses Temporal's own attempt counter — no
                // in-memory state needed — so this recovers correctly even if the
                // worker restarts between retries. See PotholeWorkflow's RetryPolicy
                // on this activity's ExecuteActivityAsync call.
                var attempt = ActivityExecutionContext.Current.Info.Attempt;
                if (attempt < 3)
                {
                    _logger.LogWarning("Notify utility company attempt {Attempt} failed (simulated) for {Street}.", attempt, street);
                    throw new ApplicationFailureException($"Simulated utility-company API failure (attempt {attempt}).");
                }

                result = $"Utility company notified about pothole on {street} (succeeded on attempt {attempt}).";
                _logger.LogInformation("{Message}", result);
                break;

            case "closeTicket":
                result = $"Repair crew closed the ticket for {street} (severity was '{previousResult}').";
                _logger.LogInformation("{Message}", result);
                break;

            default:
                throw new NotSupportedException($"No activity behavior registered for step type '{stepType}'.");
        }

        await Task.Delay(DemoStepDelay);
        return result;
    }
}
