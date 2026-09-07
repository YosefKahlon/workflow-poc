using SmartCityPoc.Shared;
using Temporalio.Workflows;

namespace SmartCityPoc.Worker.Domains.FireDispatch;

/// <summary>
/// "Fire Detected → Call 102" — the reference flow for this POC. Runs the BRE
/// guardrail, then pauses for a human dispatcher's approval signal before any
/// dispatch or notification activity executes. The "call 102" activity is
/// mocked and never contacts a real emergency service.
/// </summary>
[Workflow]
public class FireDetectionWorkflow
{
    private ApprovalSignal? _approval;
    private string _phase = "AwaitingBreCheck";
    private BreResult? _bre;

    [WorkflowRun]
    public async Task<FireWorkflowResult> RunAsync(FireEvent fireEvent)
    {
        _phase = "EvaluatingBre";
        _bre = await Workflow.ExecuteActivityAsync(
            (FireDetectionActivities act) => act.EvaluateBreAsync(fireEvent),
            new() { StartToCloseTimeout = TimeSpan.FromSeconds(30) });

        // Versioning demo: this step was added after some FireDetectionWorkflow runs may
        // already be in-flight (paused at AwaitingHumanApproval below, potentially for a
        // long time). Workflow.Patched("add-incident-audit-log") makes that safe —
        // replaying an OLD workflow's history (recorded before this code existed) takes
        // the false branch and skips this step, matching what actually happened; a NEW
        // workflow started after this code shipped takes the true branch and records a
        // marker in its own history so every future replay agrees. Without this, deploying
        // this change while a workflow was paused here would fail that workflow's next
        // replay with a nondeterminism error.
        if (Workflow.Patched("add-incident-audit-log"))
        {
            _phase = "LoggingIncidentForAudit";
            await Workflow.ExecuteActivityAsync(
                (FireDetectionActivities act) => act.LogIncidentForAuditAsync(fireEvent, _bre),
                new() { StartToCloseTimeout = TimeSpan.FromSeconds(30) });
        }

        _phase = "AwaitingHumanApproval";
        await Workflow.WaitConditionAsync(() => _approval != null);

        if (!_approval!.Approved)
        {
            _phase = "RejectedByDispatcher";
            return new FireWorkflowResult("RejectedByDispatcher", _bre, _approval, null, null);
        }

        _phase = "Dispatching";
        var callResult = await Workflow.ExecuteActivityAsync(
            (FireDetectionActivities act) => act.CallFireDepartmentMockAsync(fireEvent, _bre),
            new() { StartToCloseTimeout = TimeSpan.FromSeconds(30) });

        _phase = "NotifyingResidents";
        var notifyResult = await Workflow.ExecuteActivityAsync(
            (FireDetectionActivities act) => act.NotifyResidentsAsync(fireEvent, _bre),
            new() { StartToCloseTimeout = TimeSpan.FromSeconds(30) });

        _phase = "Completed";
        return new FireWorkflowResult("Completed", _bre, _approval, callResult, notifyResult);
    }

    [WorkflowSignal]
    public Task ApproveAsync(ApprovalSignal signal)
    {
        _approval = signal;
        return Task.CompletedTask;
    }

    [WorkflowQuery]
    public WorkflowStatus GetStatus() => new(_phase, _bre);
}
