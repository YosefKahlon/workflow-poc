namespace SmartCityPoc.Shared;

/// <summary>
/// Result of drafting (and simulating the send of) a resident notification.
/// </summary>
public record ResidentNotificationResult(
    bool Sent,
    string MessageText,
    string Source);
