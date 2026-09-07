namespace SmartCityPoc.Shared;

/// <summary>
/// Output of the deterministic Business Rule Engine guardrail check.
/// </summary>
public record BreResult(
    string Severity,
    bool RequiresHumanApproval,
    string Reasoning);
