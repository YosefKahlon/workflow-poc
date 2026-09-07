using System.Text.Json;
using SmartCityPoc.Api;
using SmartCityPoc.Shared;
using Temporalio.Client;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddTemporalClient("localhost:7233", "default");

const string CorsPolicy = "workflow-editor";
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicy, policy =>
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(CorsPolicy);

// In-memory store for the workflow-editor's diagrams, one per canvas ID (the
// visual flow definition for that canvas — "fire-dispatch", "pothole-report",
// or any canvas a user creates in the editor's canvas switcher). This is
// POC-only persistence for the editor's `api` integration strategy — not
// related to Temporal workflow execution. The Api doesn't know or care what a
// "canvas" is; it just stores whatever JSON blob it's handed under that ID.
var savedDiagrams = new Dictionary<string, JsonElement>();
var diagramLock = new object();

app.MapGet("/api/workflow-diagrams/{canvasId}", (string canvasId) =>
{
    lock (diagramLock)
    {
        return savedDiagrams.TryGetValue(canvasId, out var diagram) ? Results.Ok(diagram) : Results.NotFound();
    }
});

app.MapPost("/api/workflow-diagrams/{canvasId}", async (string canvasId, HttpRequest request) =>
{
    using var doc = await JsonDocument.ParseAsync(request.Body);
    lock (diagramLock)
    {
        savedDiagrams[canvasId] = doc.RootElement.Clone();
    }
    return Results.Ok();
});

// In-memory store for the list of canvases itself (id/name/which node types
// each includes) — same dumb-JSON-blob approach as the diagrams above. The
// frontend owns the actual shape; the Api just persists whatever array it's given.
JsonElement? savedCanvasList = null;
var canvasListLock = new object();

app.MapGet("/api/canvases", () =>
{
    lock (canvasListLock)
    {
        return savedCanvasList is { } list ? Results.Ok(list) : Results.NotFound();
    }
});

app.MapPost("/api/canvases", async (HttpRequest request) =>
{
    using var doc = await JsonDocument.ParseAsync(request.Body);
    lock (canvasListLock)
    {
        savedCanvasList = doc.RootElement.Clone();
    }
    return Results.Ok();
});

// Trigger: accepts a mock fire-detection event and starts the Temporal workflow.
app.MapPost("/events/fire", async (FireEvent fireEvent, ITemporalClient client) =>
{
    var workflowId = $"fire-{Guid.NewGuid():N}";
    var handle = await client.StartWorkflowAsync(
        "FireDetectionWorkflow",
        new object?[] { fireEvent },
        new WorkflowOptions(id: workflowId, taskQueue: TaskQueues.FireDetection));
    return Results.Ok(new StartWorkflowResponse(handle.Id, handle.ResultRunId ?? string.Empty));
});

// Human-in-the-loop: a dispatcher approves or rejects the pending dispatch.
app.MapPost("/workflows/{workflowId}/approve", async (string workflowId, ApprovalSignal signal, ITemporalClient client) =>
{
    var handle = client.GetWorkflowHandle(workflowId);
    await handle.SignalAsync("Approve", new object?[] { signal });
    return Results.Ok();
});

// Convenience: current phase of the workflow (AwaitingHumanApproval, Dispatching, Completed, ...).
// GetStatus's return type differs per domain (WorkflowStatus for Fire, PotholeStatus
// for Pothole) — both are JSON-shaped with a "phase" field, but only querying with the
// matching CLR type preserves the domain-specific fields (e.g. Pothole's CurrentStepId).
//
// displayStatus turns that plus Temporal's own execution status (from DescribeAsync —
// real visibility, not app state) into exactly the four states the UI shows:
// Running / Waiting for approval / Completed / Failed. The custom phase query alone
// can't tell "Failed" apart from "stuck on the last phase it set before throwing", so
// this always checks the workflow's real Temporal status first.
// Short timeout so a dead/restarting worker degrades the status badge to a
// plain "Running" within ~3s instead of hanging on Temporal's ~30s query
// default — this endpoint is polled every 500ms by the editor.
var queryRpcOptions = new WorkflowQueryOptions { Rpc = new RpcOptions { Timeout = TimeSpan.FromSeconds(3) } };

app.MapGet("/workflows/{workflowId}/status", async (string workflowId, ITemporalClient client) =>
{
    var handle = client.GetWorkflowHandle(workflowId);
    var description = await handle.DescribeAsync();
    var executionStatus = description.Status.ToString();

    if (workflowId.StartsWith("pothole-", StringComparison.Ordinal))
    {
        if (executionStatus != "Running")
        {
            return Results.Ok(new { phase = "completed", currentStepId = (string?)null, executionStatus, displayStatus = ToDisplayStatus(executionStatus, isWaiting: false) });
        }

        // The workflow itself (per DescribeAsync above) is genuinely Running on the
        // Temporal server no matter what — but a Query is a synchronous RPC that a live
        // worker must answer, so it fails while no worker is polling this task queue
        // (e.g. mid worker-restart, or the crash-test scenario). That's not a bug: it's
        // the honest distinction between "the workflow is durable" (always true here)
        // and "we can currently ask it fine-grained questions" (needs a live worker).
        try
        {
            var potholeStatus = await handle.QueryAsync<PotholeStatus>("GetStatus", Array.Empty<object?>(), queryRpcOptions);
            var isWaiting = PotholeStepCatalog.Kinds.TryGetValue(potholeStatus.Phase, out var kind) && kind == StepKind.Wait;
            return Results.Ok(new { phase = potholeStatus.Phase, currentStepId = potholeStatus.CurrentStepId, executionStatus, displayStatus = ToDisplayStatus(executionStatus, isWaiting) });
        }
        catch (Temporalio.Exceptions.RpcException)
        {
            return Results.Ok(new { phase = (string?)null, currentStepId = (string?)null, executionStatus, displayStatus = "Running" });
        }
    }

    if (executionStatus != "Running")
    {
        return Results.Ok(new { phase = executionStatus, bre = (BreResult?)null, executionStatus, displayStatus = ToDisplayStatus(executionStatus, isWaiting: false) });
    }

    try
    {
        var status = await handle.QueryAsync<WorkflowStatus>("GetStatus", Array.Empty<object?>(), queryRpcOptions);
        var awaitingApproval = status.Phase == "AwaitingHumanApproval";
        return Results.Ok(new { phase = status.Phase, bre = status.Bre, executionStatus, displayStatus = ToDisplayStatus(executionStatus, awaitingApproval) });
    }
    catch (Temporalio.Exceptions.RpcException)
    {
        return Results.Ok(new { phase = (string?)null, bre = (BreResult?)null, executionStatus, displayStatus = "Running" });
    }
});

static string ToDisplayStatus(string executionStatus, bool isWaiting) => executionStatus switch
{
    "Running" => isWaiting ? "Waiting for approval" : "Running",
    "Completed" => "Completed",
    _ => "Failed", // Failed, Terminated, Canceled, TimedOut — all "Failed" for this POC's simple status display.
};

// Audit trail: Temporal's own workflow execution history, surfaced as-is.
app.MapGet("/workflows/{workflowId}/history", async (string workflowId, ITemporalClient client) =>
{
    var handle = client.GetWorkflowHandle(workflowId);
    var history = await handle.FetchHistoryAsync();
    return Results.Content(history.ToJson(), "application/json");
});

// -----------------------------------------------------------

// Run: reads whatever diagram was last saved for the pothole-report canvas and
// converts it into the step list PotholeWorkflow will actually execute — this is
// the seam that makes the saved diagram the source of truth, not just a picture.
app.MapPost("/events/pothole", async (PotholeReportRequest request, ITemporalClient client) =>
{
    List<StepDefinition> steps;
    try
    {
        JsonElement? diagram;
        lock (diagramLock)
        {
            diagram = savedDiagrams.TryGetValue("pothole-report", out var saved) ? saved : null;
        }
        steps = diagram is { } d ? PotholeDiagramConverter.ConvertToSteps(d) : PotholeDiagramConverter.DefaultSteps;
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }

    var workflowId = $"pothole-{Guid.NewGuid():N}";
    var handle = await client.StartWorkflowAsync(
        "PotholeWorkflow",
        new object?[] { request.Street, steps },
        new WorkflowOptions(id: workflowId, taskQueue: TaskQueues.PotholeReport));
    return Results.Ok(new StartWorkflowResponse(handle.Id, handle.ResultRunId ?? string.Empty));
});

// Human action: approves whichever step the workflow is currently paused on
// (found via GetStatus), rather than a single hardcoded "repair" signal — so the
// same endpoint works for the repair-wait step, a newly-added approval step, or
// any future Wait-kind step, with no Api change required per new step type.
app.MapPost("/workflows/{workflowId}/approve-current", async (string workflowId, ITemporalClient client) =>
{
    var handle = client.GetWorkflowHandle(workflowId);
    var status = await handle.QueryAsync<PotholeStatus>("GetStatus", Array.Empty<object?>());
    if (status.CurrentStepId is null)
    {
        return Results.BadRequest(new { error = "No step is currently awaiting approval for this workflow." });
    }

    await handle.SignalAsync("ApproveStep", new object?[] { status.CurrentStepId });
    return Results.Ok();
});


app.Run();
