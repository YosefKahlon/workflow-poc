namespace SmartCityPoc.Shared;

/// <summary>
/// Mock fire-detection sensor payload. POC only — never sourced from a real sensor feed.
/// </summary>
public record FireEvent(
    string Location,
    double Confidence,
    string? Zone = null,
    DateTimeOffset? DetectedAtUtc = null);
