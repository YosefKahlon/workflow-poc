namespace SmartCityPoc.Shared;

/// <summary>
/// Dispatcher decision delivered to the running workflow via a Temporal signal.
/// </summary>
public record ApprovalSignal(
    bool Approved,
    string DispatcherId,
    string? Notes = null);
