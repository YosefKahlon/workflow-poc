namespace SmartCityPoc.Shared;

/// <summary>
/// How the Pothole interpreter workflow should treat a step. "Trigger" marks the
/// start-of-graph node (never itself executed); "Activity" dispatches to
/// PotholeActivities.ExecuteStepAsync; "Wait" pauses on an ApproveStep signal.
/// </summary>
public enum StepKind
{
    Trigger,
    Activity,
    Wait,
}

/// <summary>
/// The catalog of node types the Pothole diagram's steps are allowed to use.
/// Both the Api (to validate/convert a saved diagram) and the Worker (to
/// interpret it at runtime) share this single source of truth.
/// </summary>
public static class PotholeStepCatalog
{
    public static readonly IReadOnlyDictionary<string, StepKind> Kinds = new Dictionary<string, StepKind>
    {
        ["potholeReport"] = StepKind.Trigger,
        ["assessSeverity"] = StepKind.Activity,
        ["notifyUtility"] = StepKind.Activity,
        ["closeTicket"] = StepKind.Activity,
        ["repairWait"] = StepKind.Wait,
        ["approval"] = StepKind.Wait,
    };
}

/// <summary>
/// One node from a saved Pothole diagram, translated into an executable step.
/// Passed as part of the Temporal workflow's input, not read from the diagram
/// again once the workflow has started.
/// </summary>
public record StepDefinition(string Id, string Type, Dictionary<string, string> Properties);
