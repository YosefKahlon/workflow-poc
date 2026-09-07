namespace SmartCityPoc.Shared;

/// <summary>
/// Snapshot of a fire-dispatch workflow's current phase, returned by a Temporal query.
/// </summary>
public record WorkflowStatus(string Phase, BreResult? Bre);
