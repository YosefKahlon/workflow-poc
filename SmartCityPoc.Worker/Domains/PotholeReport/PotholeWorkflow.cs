using SmartCityPoc.Shared;
using Temporalio.Common;
using Temporalio.Workflows;

namespace SmartCityPoc.Worker.Domains.PotholeReport;

/// <summary>
/// Interprets whatever step list the Api built from the saved Pothole diagram —
/// it has no hardcoded notion of "assess then wait then close". Adding, removing,
/// or reordering steps in the editor (as long as each step's type is in
/// PotholeStepCatalog) changes what the *next* run of this workflow does,
/// without any change to this file.
/// </summary>
[Workflow]
public class PotholeWorkflow
{
    private readonly HashSet<string> _approvedStepIds = new();
    private readonly List<string> _completedStepIds = new();
    private string? _currentStepId;
    private string? _currentStepType;

    [WorkflowRun]
    public async Task<string> RunAsync(string street, List<StepDefinition> steps)
    {
        await Workflow.ExecuteActivityAsync(
            (PotholeActivities act) => act.LogPotholeAsync(street),
            new() { StartToCloseTimeout = TimeSpan.FromSeconds(30) });

        string? lastResult = null;
        foreach (var step in steps)
        {
            _currentStepId = step.Id;
            _currentStepType = step.Type;

            switch (PotholeStepCatalog.Kinds[step.Type])
            {
                case StepKind.Wait:
                    await Workflow.WaitConditionAsync(() => _approvedStepIds.Contains(step.Id));
                    break;
                case StepKind.Activity:
                    lastResult = await Workflow.ExecuteActivityAsync(
                        (PotholeActivities act) => act.ExecuteStepAsync(step.Type, street, step.Properties, lastResult),
                        new()
                        {
                            StartToCloseTimeout = TimeSpan.FromSeconds(30),
                            // Applies to every activity step, but only "notifyUtility" (the
                            // retry-policy demo) ever actually fails, so this is a no-op for
                            // the others. Short intervals keep the demo fast and observable.
                            RetryPolicy = new RetryPolicy
                            {
                                InitialInterval = TimeSpan.FromSeconds(1),
                                BackoffCoefficient = 1.5f,
                                MaximumAttempts = 5,
                            },
                        });
                    break;
                case StepKind.Trigger:
                default:
                    throw new InvalidOperationException($"Step '{step.Id}' has non-executable kind for type '{step.Type}'.");
            }

            _completedStepIds.Add(step.Id);
        }

        _currentStepId = null;
        _currentStepType = "completed";
        return lastResult ?? "Completed";
    }

    [WorkflowSignal]
    public Task ApproveStepAsync(string stepId)
    {
        _approvedStepIds.Add(stepId);
        return Task.CompletedTask;
    }

    [WorkflowQuery]
    public PotholeStatus GetStatus() => new(_currentStepType ?? "loggingReport", _currentStepId);
}
