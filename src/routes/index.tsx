import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { AlertTriangle, ArrowUpRight, Building2, MapPin } from "lucide-react";
import { useStore } from "@/lib/store";
import {
  formatMoney,
  phaseVariancePct,
  projectActual,
  projectPlanned,
  projectProgress,
  projectVariancePct,
  type Project,
} from "@/lib/mock-data";
import {
  CardSkeleton,
  DualBar,
  EmptyState,
  MoneyCounter,
  Panel,
  PercentCounter,
  SectionTitle,
  StatusRing,
  TiltCard,
  VarianceBadge,
} from "@/components/kit";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portfolio — BuildTrack Budget & Variance" },
      {
        name: "description",
        content:
          "Live portfolio view of active construction projects with planned vs actual cost health, variance and at-risk flags.",
      },
      { property: "og:title", content: "Portfolio — BuildTrack Budget & Variance" },
      {
        property: "og:description",
        content: "Track planned vs actual construction cost across every active project.",
      },
    ],
  }),
  component: Portfolio,
});

function Portfolio() {
  const { projects, loading } = useStore();

  const planned = projects.reduce((a, p) => a + projectPlanned(p), 0);
  const actual = projects.reduce((a, p) => a + projectActual(p), 0);
  const atRisk = projects.filter((p) => projectVariancePct(p) > 7);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-wrap items-end justify-between gap-6"
      >
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
            Portfolio control room
          </div>
          <h1 className="mt-2 text-4xl font-bold tracking-tight lg:text-5xl">
            Every dollar,
            <span className="bg-gradient-to-r from-primary to-[var(--ember-glow)] bg-clip-text text-transparent">
              {" "}
              phase by phase
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Original plan, revisions, current plan and actuals — reconciled into variance you can act
            on before the next draw request.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Current plan" value={<MoneyCounter value={planned} />} />
          <Kpi label="Actuals to date" value={<MoneyCounter value={actual} />} />
          <Kpi
            label="Projects at risk"
            value={<span className="num">{atRisk.length}</span>}
            tone={atRisk.length ? "critical" : "good"}
          />
          <Kpi label="Active projects" value={<span className="num">{projects.length}</span>} />
        </div>
      </motion.div>

      <div>
        <SectionTitle eyebrow="Active projects" title="Project health" />
        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
            : projects.map((p, i) => <ProjectCard key={p.id} project={p} index={i} />)}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "good" | "critical";
}) {
  return (
    <Panel className="min-w-[130px] px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "mt-1 text-xl font-bold " +
          (tone === "critical" ? "text-critical" : tone === "good" ? "text-good" : "")
        }
      >
        {value}
      </div>
    </Panel>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const planned = projectPlanned(project);
  const actual = projectActual(project);
  const progress = projectProgress(project);
  const variance = projectVariancePct(project);
  const atRisk = variance > 7;
  const worst = [...project.phases].sort((a, b) => phaseVariancePct(b) - phaseVariancePct(a))[0];

  if (project.phases.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <EmptyState
          title={project.name}
          message="No phases yet. Open the project to define your own phases and start capturing plan versus actual."
          action={
            <Link
              to="/project/$projectId"
              params={{ projectId: project.id }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Open project <ArrowUpRight className="h-4 w-4" />
            </Link>
          }
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard>
        <Link to="/project/$projectId" params={{ projectId: project.id }} className="block">
          <Panel className="lift group h-full overflow-hidden border p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-lg font-bold">{project.name}</h3>
                  {atRisk && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-critical/40 bg-critical/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-critical">
                      <AlertTriangle className="h-3 w-3" /> At risk
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {project.client}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {project.location}
                  </span>
                </div>
              </div>
              <StatusRing progress={progress} variancePct={variance} size={78} stroke={8} sublabel="done" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Planned {formatMoney(planned, true)}</span>
                <span>Actual {formatMoney(actual, true)}</span>
              </div>
              <DualBar planned={planned} actual={actual} />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <Stat label="Variance" value={<PercentCounter value={variance} />} tone={variance > 7 ? "critical" : variance > 2 ? "warning" : "good"} />
              <Stat label="Phases" value={<span className="num">{project.phases.length}</span>} />
              <Stat
                label="Revisions"
                value={
                  <span className="num">
                    {project.phases.reduce((a, ph) => a + ph.revisions.length, 0)}
                  </span>
                }
              />
            </div>

            {worst && (
              <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs">
                <span className="text-muted-foreground">
                  Watch: <span className="font-semibold text-foreground">{worst.name}</span>
                </span>
                <VarianceBadge pct={phaseVariancePct(worst)} />
              </div>
            )}
          </Panel>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "good" | "warning" | "critical";
}) {
  const color =
    tone === "critical"
      ? "text-critical"
      : tone === "warning"
        ? "text-warning"
        : tone === "good"
          ? "text-good"
          : "text-foreground";
  return (
    <div className="rounded-xl border bg-surface-2/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 text-sm font-bold ${color}`}>{value}</div>
    </div>
  );
}
