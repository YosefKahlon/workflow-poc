<#
.SYNOPSIS
    Sends a mock fire-detection event to the SmartCityPoc.Api, which starts a new
    FireDetectionWorkflow execution in Temporal.

.EXAMPLE
    ./send-fire-event.ps1
    ./send-fire-event.ps1 -ApiBaseUrl http://localhost:5112

.NOTES
    This is a POC. No real emergency service is ever contacted by this event.

    Equivalent curl (git-bash / macOS / Linux):
      curl -s -X POST http://localhost:5112/events/fire \
        -H "Content-Type: application/json" \
        -d '{"location":"Caesarea Marina, Pier 3","confidence":0.92,"zone":"Residential"}'
#>
param(
    [string]$ApiBaseUrl = "http://localhost:5112"
)

$body = @{
    location   = "Caesarea Marina, Pier 3"
    confidence = 0.92
    zone       = "Residential"
} | ConvertTo-Json

Write-Host "Posting mock fire event to $ApiBaseUrl/events/fire ..." -ForegroundColor Cyan
Write-Host $body -ForegroundColor DarkGray

try {
    $response = Invoke-RestMethod -Uri "$ApiBaseUrl/events/fire" -Method Post -ContentType "application/json" -Body $body
}
catch {
    Write-Error "Failed to start workflow: $_"
    exit 1
}

Write-Host ""
Write-Host "Workflow started." -ForegroundColor Green
Write-Host "  Workflow ID: $($response.workflowId)" -ForegroundColor Yellow
Write-Host "  Run ID:      $($response.runId)"
Write-Host ""
Write-Host "Copy the Workflow ID above into approve.ps1 / get-history.ps1, e.g.:" -ForegroundColor Cyan
Write-Host "  ./approve.ps1 -WorkflowId $($response.workflowId)"
