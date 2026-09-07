# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A proof-of-concept demonstrating a Temporal-backed visual workflow builder. It is throwaway demo/learning code — not production-bound. No real emergency service, repair crew, or resident is ever contacted; the only true side effect anywhere in the system is `[MOCK]`-prefixed log lines (and, optionally, a real call to the Claude API purely to draft notification text). There is no auth and no real persistence — everything server-side is an in-memory `Dictionary` that resets whenever `SmartCityPoc.Api` restarts. See the README's warning banner before assuming any behavior is "real."

## Running the stack

Four independent processes, each in its own terminal, communicating only over the network (no shared memory, no direct calls):

```
Browser (workflow-editor)  →  SmartCityPoc.Api  →  Temporal Server  ←  SmartCityPoc.Worker
   localhost:5173              localhost:5112       localhost:7233
```

```powershell
temporal server start-dev                    # 1. Temporal dev server (localhost:7233, Web UI :8233)
dotnet run --project SmartCityPoc.Worker      # 2. Worker: hosts both domains' workflow/activity code
dotnet run --project SmartCityPoc.Api         # 3. Api: localhost:5112 — the only thing the browser talks to
cd workflow-editor && npm run dev             # 4. Editor: localhost:5173
```

If `temporal` isn't recognized after a winget install, open a new shell (PATH wasn't refreshed). Docker fallback:
```powershell
docker run --rm -p 7233:7233 -p 8233:8233 temporalio/admin-tools temporal server start-dev --ip 0.0.0.0
```

Optional — real Claude-drafted resident notifications instead of a hardcoded template (still only logged, never actually sent):
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
dotnet run --project SmartCityPoc.Worker
```

## Commands

- Build/typecheck editor: `cd workflow-editor && npm run build` (runs `tsc -b && vite build`)
- Lint editor: `cd workflow-editor && npm run lint` (oxlint)
- Build .NET solution: `dotnet build SmartCityPoc.slnx`
- There are no automated test suites in this repo (no test projects, no editor test script). Verification is manual/live — trigger a workflow through the API or UI and observe behavior via the Temporal Web UI (`localhost:8233`) or the endpoints below.
- Drive the Fire Dispatch demo without the UI: `./mock-events/send-fire-event.ps1`, `./mock-events/approve.ps1 -WorkflowId <id>`, `./mock-events/get-history.ps1 -WorkflowId <id>` (all accept `-ApiBaseUrl`, default `http://localhost:5112`). Pothole Report has no dedicated scripts — call `POST /events/pothole` and `POST /workflows/{id}/approve-current` directly with `Invoke-RestMethod`.

## Architecture

### Workflow vs. Activity (Temporal concepts used throughout)

A **Workflow** is orchestration code — decides what happens and in what order, and can pause indefinitely (`Workflow.WaitConditionAsync` waiting on a signal). An **Activity** is where actual work/I/O happens, and is the unit Temporal retries on failure. Both domains follow this split.

### The domain-module pattern (the core architectural idea of this repo)

Both `SmartCityPoc.Worker` and `workflow-editor` are split into a **generic platform layer** (knows nothing domain-specific) plus **self-contained domain folders** that plug into it. Onboarding a new domain (e.g. "Streetlight Outage") means adding `SmartCityPoc.Worker/Domains/StreetlightOutage/` and `workflow-editor/src/domains/streetlight-outage/`, plus one import + one registry-array entry on each side — **no platform/shared file changes**. This is deliberately the thing the repo demonstrates, so preserve it when adding domains: don't leak domain-specific logic into `platform/` (editor) or the shared `Program.cs`/registration code (Worker/Api) beyond a single registration line.

Editor platform contract: `workflow-editor/src/platform/workflow-domain.ts` defines the `WorkflowDomain` type every domain implements (palette items, initial nodes/edges, optional `ControlsPanel`). `workflow-editor/src/platform/domain-registry.ts` (`ALL_DOMAINS`) is the one place that knows every domain exists. `App.tsx` renders the third-party `<WorkflowBuilder.Root>` canvas generically and never imports from `domains/`.

### Two domains, two deliberately different designs

The two domains are built differently on purpose — this contrast is the interesting point of the repo, not an inconsistency to "fix":

- **Fire Dispatch** — `FireDetectionWorkflow` (`SmartCityPoc.Worker/Domains/FireDispatch/`) has a fixed, hardcoded C# step sequence. The editor's diagram for this domain is purely decorative/illustrative — dragging nodes never affects real execution; only the dedicated trigger button (a real API call) does.
- **Pothole Report** — `PotholeWorkflow` (`SmartCityPoc.Worker/Domains/PotholeReport/`) is a generic interpreter: it takes a `List<StepDefinition>` as a workflow argument and dispatches each by `StepKind` (Trigger/Activity/Wait), with no hardcoded knowledge of what steps exist. `SmartCityPoc.Api/PotholeDiagramConverter.cs` walks whatever diagram was last saved for the `pothole-report` canvas and converts its nodes/edges into that step list — **the diagram is the source of truth for what actually runs**. Constraints worth knowing when touching this: the diagram must be a single straight chain from "Pothole Reported" (no branches/cycles — rejected with a 400), only node types already in `PotholeStepCatalog` are executable, and node properties are read as strings only.

Both domains suspend on `Workflow.WaitConditionAsync` for human-in-the-loop approval — a true signal wait, not a timeout — and both expose their audit trail via `GET /workflows/{id}/history`, which returns Temporal's own `WorkflowHandle.FetchHistoryAsync()` unmodified rather than a custom log.

### Project layout

```
SmartCityPoc.Shared/    Plain C# records/enums shared by Api and Worker — no logic.
                         FireEvent, ApprovalSignal, BreResult (Fire Dispatch); StepDefinition,
                         StepKind, PotholeStatus (Pothole Report); TaskQueues.cs (task-queue names).

SmartCityPoc.Worker/     Program.cs registers TWO independent Temporal workers in one process,
                         one per task queue/domain (fire-detection-task-queue, pothole-report-task-queue).
  Domains/FireDispatch/    FireDetectionWorkflow.cs ([Workflow]), FireDetectionActivities.cs ([Activity])
  Domains/PotholeReport/   PotholeWorkflow.cs (generic step-list interpreter), PotholeActivities.cs
                           (single ExecuteStepAsync dispatch method handling all step kinds)

SmartCityPoc.Api/        Just two files.
  Program.cs               Every HTTP endpoint: /events/fire, /events/pothole,
                            /workflows/{id}/approve[-current], /workflows/{id}/status,
                            /workflows/{id}/history, /api/workflow-diagrams/{canvasId}. Thin —
                            each endpoint calls straight into the Temporal .NET client
                            (StartWorkflowAsync/SignalAsync/QueryAsync/DescribeAsync).
  PotholeDiagramConverter.cs  The one piece of real logic: saved diagram → List<StepDefinition>.

workflow-editor/src/
  App.tsx                  Generic shell rendering <WorkflowBuilder.Root>; knows nothing
                            domain-specific; never imports from domains/.
  platform/                Generic infra only: workflow-domain.ts (the WorkflowDomain contract),
                            domain-registry.ts (ALL_DOMAINS), canvas-store.ts (zustand store of
                            which canvases exist), node-registry.ts, StatusPoller.tsx (polls
                            /workflows/{id}/status every 500ms), StatusBadge.tsx, live-highlight.tsx.
  domains/fire-dispatch/    Fire's node definitions, pre-built diagram, trigger button.
  domains/pothole-report/   Pothole's node definitions, controls panel, live-highlight wiring.

mock-events/              PowerShell scripts driving the Fire Dispatch demo without the UI.
```

### How a trigger becomes "real" (extension point for new event sources)

`POST /events/fire` and `POST /events/pothole` are the entire seam between "demo" and "production" — the endpoint has no idea whether the caller was a browser button, a real sensor pipeline, or a message-queue consumer. Adding a new trigger source is purely an ingestion-side change (a thin service translating that source's events into the right API call); nothing about Temporal, the Worker, or the editor needs to change. Recurring/scheduled triggers should use Temporal's native Schedules feature, not this webhook-style path.

### Multi-canvas system

The editor supports multiple canvases via a floating bottom bar; Fire Dispatch and Pothole Report are the two default ones (one per registered domain). Switching canvases fully unmounts/remounts the editor (`key={activeCanvas.id}` in `App.tsx`) because the SDK's internal state is a singleton meant for one mounted instance at a time. A canvas created via "+ New Canvas" gets only generic node types — no bespoke trigger/status wiring; wiring a new canvas to real Temporal execution requires hand-written domain integration code, same as adding a real domain.
