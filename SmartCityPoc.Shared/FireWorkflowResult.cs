namespace SmartCityPoc.Shared;

/// <summary>
/// Final outcome of a fire-dispatch workflow run.
/// </summary>
public record FireWorkflowResult(
    string Outcome,
    BreResult Bre,
    ApprovalSignal? Approval,
    CallFireDeptResult? CallFireDept,
    ResidentNotificationResult? ResidentNotification);
