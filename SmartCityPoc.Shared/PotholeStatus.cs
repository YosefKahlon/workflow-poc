namespace SmartCityPoc.Shared;

/// <summary>
/// Snapshot of a Pothole workflow's current step, returned by a Temporal query.
/// Phase is the current step's own node type (e.g. "assessSeverity", "approval"),
/// or "completed" once the workflow has finished — this lets the editor's
/// live-highlight plugin match it directly against a canvas node's type.
/// </summary>
public record PotholeStatus(string Phase, string? CurrentStepId);
