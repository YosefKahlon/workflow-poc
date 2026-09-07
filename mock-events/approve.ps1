<#
.SYNOPSIS
    Sends a dispatcher approval (or rejection) signal to a running FireDetectionWorkflow.
    The workflow waits indefinitely on this signal (no timeout) before it will dispatch
    the (mock) fire department call and resident notification.

.EXAMPLE
    ./approve.ps1 -WorkflowId fire-abc123
    ./approve.ps1 -WorkflowId fire-abc123 -Approved:$false -DispatcherId "dispatcher-2" -Notes "False alarm"

.NOTES
    This is a POC. Approving here never triggers a real 102 / fire-department call.

    Equivalent curl (git-bash / macOS / Linux):
      curl -s -X POST http://localhost:5112/workflows/<WorkflowId>/approve \
        -H "Content-Type: application/json" \
        -d '{"approved":true,"dispatcherId":"dispatcher-1","notes":"Approved via script"}'
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$WorkflowId,

    [switch]$Approved = $true,

    [string]$DispatcherId = "dispatcher-1",

    [string]$Notes = "Approved via mock-events/approve.ps1",

    [string]$ApiBaseUrl = "http://localhost:5112"
)

$body = @{
    approved     = [bool]$Approved
    dispatcherId = $DispatcherId
    notes        = $Notes
} | ConvertTo-Json

$uri = "$ApiBaseUrl/workflows/$WorkflowId/approve"
Write-Host "Posting approval signal to $uri ..." -ForegroundColor Cyan
Write-Host $body -ForegroundColor DarkGray

try {
    Invoke-RestMethod -Uri $uri -Method Post -ContentType "application/json" -Body $body | Out-Null
}
catch {
    Write-Error "Failed to signal workflow: $_"
    exit 1
}

Write-Host ""
Write-Host "Signal sent (approved=$([bool]$Approved)) to workflow '$WorkflowId'." -ForegroundColor Green
Write-Host "Check progress with:" -ForegroundColor Cyan
Write-Host "  Invoke-RestMethod $ApiBaseUrl/workflows/$WorkflowId/status"
Write-Host "  ./get-history.ps1 -WorkflowId $WorkflowId"
