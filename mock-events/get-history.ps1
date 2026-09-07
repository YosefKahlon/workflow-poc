<#
.SYNOPSIS
    Fetches and pretty-prints the Temporal execution history for a workflow — this is
    the POC's audit trail (Temporal's own history, no custom-built logging).

.EXAMPLE
    ./get-history.ps1 -WorkflowId fire-abc123

.NOTES
    Equivalent curl (git-bash / macOS / Linux):
      curl -s http://localhost:5112/workflows/<WorkflowId>/history | python3 -m json.tool
    (or open http://localhost:8233 — the Temporal Web UI shows the same history visually)
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$WorkflowId,

    [string]$ApiBaseUrl = "http://localhost:5112"
)

$uri = "$ApiBaseUrl/workflows/$WorkflowId/history"
Write-Host "Fetching workflow history from $uri ..." -ForegroundColor Cyan

try {
    $raw = Invoke-RestMethod -Uri $uri -Method Get
}
catch {
    Write-Error "Failed to fetch history: $_"
    exit 1
}

# Invoke-RestMethod already deserializes JSON responses into objects, so just
# re-serialize with indentation and full depth for readability.
$raw | ConvertTo-Json -Depth 20
