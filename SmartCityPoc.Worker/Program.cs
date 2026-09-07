using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SmartCityPoc.Shared;
using SmartCityPoc.Worker.Domains.FireDispatch;
using SmartCityPoc.Worker.Domains.PotholeReport;
using Temporalio.Extensions.Hosting;

var builder = Host.CreateApplicationBuilder(args);

builder.Logging.AddSimpleConsole(options => options.TimestampFormat = "[HH:mm:ss] ")
    .SetMinimumLevel(LogLevel.Information);

builder.Services
    .AddHostedTemporalWorker(
        clientTargetHost: "localhost:7233",
        clientNamespace: "default",
        taskQueue: TaskQueues.FireDetection)
    .AddScopedActivities<FireDetectionActivities>()
    .AddWorkflow<FireDetectionWorkflow>();

builder.Services
    .AddHostedTemporalWorker(
        clientTargetHost: "localhost:7233",
        clientNamespace: "default",
        taskQueue: TaskQueues.PotholeReport)
    .AddScopedActivities<PotholeActivities>()
    .AddWorkflow<PotholeWorkflow>();

var host = builder.Build();

await host.RunAsync();
