import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { useStore } from "@/lib/store";
import { buildAlerts } from "@/lib/mock-data";
import { AlertRow } from "@/components/AppShell";
import { CardSkeleton, EmptyState, Panel, SectionTitle } from "@/components/kit";

export const Route = createFileRoute("/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts — BuildTrack Variance Monitoring" },
      {
        name: "description",
        content:
          "Active budget variance alerts by severity, with the project, phase and a short explanation of each signal.",
      },
      { property: "og:title", content: "Alerts — BuildTrack Variance Monitoring" },
      {
        property: "og:description",
        content: "Critical, warning and informational budget signals across your construction portfolio.",
      },
    ],
  }),
  component: AlertsPage,
});

function AlertsPage() {
  const { projects, loading } = useStore();
  const [filter, setFilter] = React.useState<"all" | "critical" | "warning" | "info">("all");
  const navigate = useNavigate();

  const alerts = React.useMemo(() => buildAlerts(projects), [projects]);
  const shown = filter === "all" ? alerts : alerts.filter((a) => a.severity === filter);
  const counts = {
    all: alerts.length,
    critical: alerts.filter((a) => a.severity === "critical").length,
    warning: alerts.filter((a) => a.severity === "warning").length,
    info: alerts.filter((a) => a.severity === "info").length,
  };

  if (loading) return <CardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          Monitoring
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Active alerts</h1>
      </div>

      <Panel className="flex flex-wrap gap-2 p-2">
        {(["all", "critical", "warning", "info"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              "rounded-lg px-3.5 py-1.5 text-sm font-semibold capitalize transition-colors " +
              (filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {f} <span className="num opacity-70">{counts[f]}</span>
          </button>
        ))}
      </Panel>

      {shown.length === 0 ? (
        <EmptyState title="All clear" message="No alerts match this filter right now." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shown.map((a, i) => (
            <AlertRow
              key={a.id}
              alert={a}
              index={i}
              onOpen={() => navigate({ to: "/project/$projectId", params: { projectId: a.projectId } })}
            />
          ))}
        </div>
      )}

      <SectionTitle eyebrow="How this works" title="Thresholds" />
      <Panel className="grid gap-4 p-5 sm:grid-cols-3 text-sm">
        <div>
          <div className="font-semibold text-critical">Critical</div>
          <p className="mt-1 text-muted-foreground">Phase actuals exceed the pro-rated current plan by more than 15%.</p>
        </div>
        <div>
          <div className="font-semibold text-warning">Warning</div>
          <p className="mt-1 text-muted-foreground">Variance between 7% and 15% — trending over before completion.</p>
        </div>
        <div>
          <div className="font-semibold text-primary">Info</div>
          <p className="mt-1 text-muted-foreground">Repeated plan revisions worth reviewing against the original budget.</p>
        </div>
      </Panel>
    </div>
  );
}
