using System.Text.Json;
using SmartCityPoc.Shared;

namespace SmartCityPoc.Api;

/// <summary>
/// Turns a saved Pothole diagram (the raw JSON the workflow-editor SDK POSTs to
/// /api/workflow-diagrams/pothole-report) into the ordered step list PotholeWorkflow
/// executes. This is the seam where "what was drawn" becomes "what actually runs".
///
/// POC scope: the diagram must be a single linear chain from the trigger node —
/// no branching, no cycles. That's enough to prove the diagram drives execution;
/// it is not a general-purpose graph engine.
/// </summary>
public static class PotholeDiagramConverter
{
    private const string TriggerNodeType = "potholeReport";

    // Matches today's hardcoded PotholeWorkflow order, used only when nothing has
    // ever been saved for the pothole-report canvas yet.
    public static readonly List<StepDefinition> DefaultSteps = new()
    {
        new StepDefinition("default-assess", "assessSeverity", new()),
        new StepDefinition("default-wait", "repairWait", new()),
        new StepDefinition("default-close", "closeTicket", new()),
    };

    public static List<StepDefinition> ConvertToSteps(JsonElement diagram)
    {
        var nodesById = new Dictionary<string, (string Type, Dictionary<string, string> Properties)>();
        foreach (var node in diagram.GetProperty("nodes").EnumerateArray())
        {
            var id = node.GetProperty("id").GetString()
                ?? throw new InvalidOperationException("Diagram node is missing an id.");
            var data = node.GetProperty("data");
            var type = data.GetProperty("type").GetString()
                ?? throw new InvalidOperationException($"Node '{id}' is missing data.type.");

            var properties = new Dictionary<string, string>();
            if (data.TryGetProperty("properties", out var propsElement) && propsElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var prop in propsElement.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.String)
                    {
                        properties[prop.Name] = prop.Value.GetString()!;
                    }
                }
            }

            nodesById[id] = (type, properties);
        }

        var nextNodeId = new Dictionary<string, string>();
        foreach (var edge in diagram.GetProperty("edges").EnumerateArray())
        {
            var source = edge.GetProperty("source").GetString()
                ?? throw new InvalidOperationException("Diagram edge is missing a source.");
            var target = edge.GetProperty("target").GetString()
                ?? throw new InvalidOperationException("Diagram edge is missing a target.");

            if (!nextNodeId.TryAdd(source, target))
            {
                throw new InvalidOperationException(
                    $"Node '{source}' has more than one outgoing edge — branching diagrams aren't supported yet.");
            }
        }

        var triggerId = nodesById
            .Where(kv => kv.Value.Type == TriggerNodeType)
            .Select(kv => kv.Key)
            .FirstOrDefault()
            ?? throw new InvalidOperationException(
                $"Diagram has no node of type '{TriggerNodeType}' to start the chain from.");

        var steps = new List<StepDefinition>();
        var visited = new HashSet<string> { triggerId };
        var currentId = triggerId;

        while (nextNodeId.TryGetValue(currentId, out var nextId))
        {
            if (!visited.Add(nextId))
            {
                throw new InvalidOperationException($"Diagram contains a cycle at node '{nextId}'.");
            }

            if (!nodesById.TryGetValue(nextId, out var next))
            {
                throw new InvalidOperationException($"Edge points to unknown node '{nextId}'.");
            }

            if (!PotholeStepCatalog.Kinds.ContainsKey(next.Type))
            {
                throw new InvalidOperationException(
                    $"Unknown step type '{next.Type}' on node '{nextId}' — add it to PotholeStepCatalog before using it in a saved diagram.");
            }

            steps.Add(new StepDefinition(nextId, next.Type, next.Properties));
            currentId = nextId;
        }

        return steps;
    }
}
