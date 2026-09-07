namespace SmartCityPoc.Shared;

/// <summary>
/// Result of the MOCKED "call 102" activity. This never represents a real emergency call.
/// </summary>
public record CallFireDeptResult(
    bool Success,
    string Message,
    DateTimeOffset CalledAtUtc);
