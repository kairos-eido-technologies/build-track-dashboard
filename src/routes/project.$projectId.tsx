import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowUpRight, CalendarDays } from "lucide-react";
import { useProject, useStore } from "@/lib/store";
import {
  catTotals,
  formatMoney,
  phaseActual,
  phaseOriginal,
  phasePlanned,
  phaseVariancePct,
  projectActual,
  projectPlanned,
  projectProgress,
  projectVariancePct,
  type Phase,
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

export const Route = createFileRoute("/project/$projectId")({
  head: () => ({
    meta: [
      { title: "Project variance — BuildTrack" },
      {
        name: "description",
        content:
          "Phase-level planned vs actual breakdown across materials, labor and tasks with live variance tracking.",
      },
      { property: "og:title", content: "Project variance — BuildTrack" },
      {
        property: "og:description",
        content: "Phase timeline, variance percentages and cost health for a construction project.",
      },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const project = useProject(projectId);
  const { loading } = useStore();
  const navigate = useNavigate();
  const [selected, setSelected] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        message="This project may have been archived."
        action={
          <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back to portfolio
          </Link>
        }
      />
    );
  }

  const planned = projectPlanned(project);
  const actual = projectActual(project);
  const variance = projectVariancePct(project);
  const progress = projectProgress(project);
  const selectedPhase = project.phases.find((p) => p.id === selected) ?? null;

  return (
    <div className="space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Portfolio
      </Link>

      <motion.div
        layoutId={`project-${project.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-6"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>{project.client}</span>
            <span>{project.location}</span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" /> {project.startDate} → {project.targetDate}
            </span>
          </div>
        </div>
        <Panel className="flex items-center gap-6 px-6 py-4">
          <StatusRing progress={progress} variancePct={variance} size={92} sublabel="complete" />
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Overall variance
            </div>
            <div
              className={
                "text-3xl font-bold " +
                (variance > 7 ? "text-critical" : variance > 2 ? "text-warning" : "text-good")
              }
            >
              <PercentCounter value={variance} />
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              <MoneyCounter value={actual} /> actual · <MoneyCounter value={planned} /> current plan
            </div>
          </div>
        </Panel>
      </motion.div>

      {project.phases.length === 0 ? (
        <EmptyState
          title="No phases defined"
          message="This project has no phases yet. Phases are user-named — Foundation, Framing, or anything specific to your scope."
        />
      ) : (
        <>
          <Panel className="p-5">
            <SectionTitle eyebrow="Sequence" title="Phase timeline" />
            <div className="flex gap-1.5">
              {project.phases.map((phase, i) => {
                const v = phaseVariancePct(phase);
                const active = selected === phase.id;
                const share = phasePlanned(phase) / planned;
                return (
                  <motion.button
                    key={phase.id}
                    onClick={() => setSelected(active ? null : phase.id)}
                    initial={{ opacity: 0, scaleX: 0.6 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    style={{ flexGrow: Math.max(share, 0.08) }}
                    className="group relative min-w-0 origin-left"
                  >
                    <div
                      className={
                        "h-14 overflow-hidden rounded-lg border transition-all " +
                        (active
                          ? "border-primary/60 ember-glow"
                          : "border-border hover:border-primary/40")
                      }
                      style={{ background: "color-mix(in oklab, var(--surface-2) 80%, transparent)" }}
                    >
                      <motion.div
                        className="h-full"
                        style={{
                          background:
                            v > 8
                              ? "linear-gradient(180deg, color-mix(in oklab, var(--critical) 45%, transparent), transparent)"
                              : v > 2
                                ? "linear-gradient(180deg, color-mix(in oklab, var(--warning) 40%, transparent), transparent)"
                                : "linear-gradient(180deg, color-mix(in oklab, var(--good) 38%, transparent), transparent)",
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${phase.progress * 100}%` }}
                        transition={{ delay: 0.3 + i * 0.06, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>
                    <div className="mt-2 truncate text-[11px] font-semibold">{phase.name}</div>
                    <div className="num text-[10px] text-muted-foreground">
                      {Math.round(phase.progress * 100)}% · {v > 0 ? "+" : ""}
                      {v.toFixed(1)}%
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              {selectedPhase && (
                <motion.div
                  key={selectedPhase.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 grid gap-4 rounded-xl border bg-surface-2/40 p-5 md:grid-cols-[auto_1fr_auto]">
                    <StatusRing
                      progress={selectedPhase.progress}
                      variancePct={phaseVariancePct(selectedPhase)}
                      size={104}
                    />
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold">{selectedPhase.name}</h3>
                      <CategoryBreakdown phase={selectedPhase} />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() =>
                          navigate({
                            to: "/project/$projectId/phase/$phaseId",
                            params: { projectId: project.id, phaseId: selectedPhase.id },
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03]"
                      >
                        Open phase detail <ArrowUpRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Panel>

          <div>
            <SectionTitle eyebrow="Breakdown" title="Phases" />
            <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {project.phases.map((phase, i) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  projectId={project.id}
                  index={i}
                  selected={selected === phase.id}
                  onSelect={() => setSelected(selected === phase.id ? null : phase.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryBreakdown({ phase }: { phase: Phase }) {
  const p = catTotals(phase, "plannedCost");
  const a = catTotals(phase, "actualCost");
  const cats = [
    ["Materials", p.materials, a.materials],
    ["Labor", p.labor, a.labor],
    ["Tasks", p.tasks, a.tasks],
  ] as const;
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {cats.map(([label, plan, act]) => {
        const expected = plan * phase.progress;
        const v = expected > 0 ? ((act - expected) / expected) * 100 : 0;
        return (
          <div key={label} className="rounded-lg border bg-background/40 p-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <VarianceBadge pct={v} showIcon={false} />
            </div>
            <div className="num mt-2 text-sm font-bold">{formatMoney(act, true)}</div>
            <div className="num text-[11px] text-muted-foreground">
              of {formatMoney(plan, true)} plan
            </div>
            <DualBar planned={plan} actual={act} className="mt-2" />
          </div>
        );
      })}
    </div>
  );
}

function PhaseCard({
  phase,
  projectId,
  index,
  selected,
  onSelect,
}: {
  phase: Phase;
  projectId: string;
  index: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const v = phaseVariancePct(phase);
  const planned = phasePlanned(phase);
  const actual = phaseActual(phase);
  const original = phaseOriginal(phase);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <TiltCard intensity={4}>
        <Panel
          glow={selected}
          className={
            "lift border p-5 " + (selected ? "border-primary/50" : "")
          }
        >
          <button onClick={onSelect} className="w-full text-left">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">{phase.name}</h3>
                <div className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {phase.status.replace("-", " ")} · {phase.revisions.length} revisions
                </div>
              </div>
              <StatusRing progress={phase.progress} variancePct={v} size={64} stroke={7} />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <MiniStat label="Original" value={formatMoney(original, true)} />
              <MiniStat label="Current plan" value={formatMoney(planned, true)} />
              <MiniStat label="Actual" value={formatMoney(actual, true)} />
            </div>

            <div className="mt-4">
              <CategoryBreakdown phase={phase} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t pt-3">
              <span className="text-xs text-muted-foreground">Phase variance</span>
              <VarianceBadge pct={v} />
            </div>
          </button>
          <Link
            to="/project/$projectId/phase/$phaseId"
            params={{ projectId, phaseId: phase.id }}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            Line items & revisions <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Panel>
      </TiltCard>
    </motion.div>
  );
}

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border bg-surface-2/40 px-2.5 py-2">
    <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
    <div className="num mt-0.5 text-sm font-bold">{value}</div>
  </div>
);
