import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStore } from "@/lib/store";
import {
  catTotals,
  formatMoney,
  phaseActual,
  phasePlanned,
  phaseVariancePct,
  sum,
} from "@/lib/mock-data";
import { CardSkeleton, Panel, SectionTitle, VarianceBadge } from "@/components/kit";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Insights & Analysis — BuildTrack" },
      {
        name: "description",
        content:
          "Cost composition, phase planned-vs-actual comparisons, top overrun contributors and cross-project variance patterns.",
      },
      { property: "og:title", content: "Insights & Analysis — BuildTrack" },
      {
        property: "og:description",
        content: "Where construction budget leaks — ranked and visualized across the portfolio.",
      },
    ],
  }),
  component: Analysis;
});

function Analysis() {
  const { projects, loading } = useStore();

  const composition = React.useMemo(() => {
    let m = 0,
      l = 0,
      t = 0;
    projects.forEach((p) =>
      p.phases.forEach((ph) => {
        const a = catTotals(ph, "actualCost");
        m += a.materials;
        l += a.labor;
        t += a.tasks;
      }),
    );
    return [
      { name: "Materials", value: Math.round(m) },
      { name: "Labor", value: Math.round(l) },
      { name: "Other / Tasks", value: Math.round(t) },
    ];
  }, [projects]);

  const phaseRows = React.useMemo(
    () =>
      projects
        .flatMap((p) =>
          p.phases.map((ph) => ({
            name: `${ph.name} · ${p.name.split(" ")[0]}`,
            planned: Math.round(phasePlanned(ph) * ph.progress),
            actual: Math.round(phaseActual(ph)),
            variance: phaseVariancePct(ph),
            project: p.name,
            phase: ph.name,
          })),
        )
        .filter((r) => r.actual > 0)
        .sort((a, b) => b.variance - a.variance),
    [projects],
  );

  const contributors = React.useMemo(
    () =>
      phaseRows
        .map((r) => ({ ...r, overrun: r.actual - r.planned }))
        .sort((a, b) => b.overrun - a.overrun)
        .slice(0, 6),
    [phaseRows],
  );

  const crossProject = React.useMemo(() => {
    const map = new Map<string, { over: number; total: number }>();
    projects.forEach((p) =>
      p.phases.forEach((ph) => {
        const e = map.get(ph.name) ?? { over: 0, total: 0 };
        e.total += 1;
        if (phaseVariancePct(ph) > 5) e.over += 1;
        map.set(ph.name, e);
      }),
    );
    return [...map.entries()]
      .filter(([, v]) => v.total >= 2 && v.over > 0)
      .sort((a, b) => b[1].over / b[1].total - a[1].over / a[1].total)
      .slice(0, 4);
  }, [projects]);

  const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-4)"];
  const total = sum(composition.map((c) => c.value));

  if (loading)
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary">
          Insights
        </div>
        <h1 className="mt-2 text-3xl font-bold tracking-tight lg:text-4xl">Where the money moves</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Panel className="p-5">
          <SectionTitle eyebrow="Actuals" title="Cost composition" />
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={composition}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={100}
                  paddingAngle={3}
                  animationDuration={1200}
                  stroke="transparent"
                >
                  {composition.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => formatMoney(v)}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {composition.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />
                  {c.name}
                </span>
                <span className="num text-muted-foreground">
                  {formatMoney(c.value, true)} · {((c.value / (total || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Sorted by variance %" title="Phase planned vs actual" />
          <div className="h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseRows.slice(0, 12)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatMoney(v, true)}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={170}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                  formatter={(v: number) => formatMoney(v)}
                />
                <Legend />
                <Bar
                  dataKey="planned"
                  name="Pro-rated plan"
                  fill="var(--chart-2)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1100}
                />
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill="var(--chart-1)"
                  radius={[0, 4, 4, 0]}
                  animationDuration={1300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionTitle eyebrow="Ranked" title="Top contributors to overrun" />
          <div className="space-y-3">
            {contributors.map((c, i) => (
              <motion.div
                key={c.name}
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="rounded-xl border bg-surface-2/40 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="num grid h-7 w-7 place-items-center rounded-lg bg-primary/15 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{c.phase}</div>
                      <div className="text-[11px] text-muted-foreground">{c.project}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-sm font-bold text-critical">
                      +{formatMoney(Math.max(c.overrun, 0), true)}
                    </div>
                    <VarianceBadge pct={c.variance} showIcon={false} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionTitle eyebrow="Cross-project patterns" title="Recurring overruns" />
          <div className="space-y-3">
            {crossProject.map(([name, v], i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-xl border border-warning/25 bg-warning/8 p-4"
              >
                <div className="text-sm font-semibold">
                  {name} came in over budget in {v.over} of the last {v.total} projects
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Consider tightening the estimating basis and adding a contingency line for {name.toLowerCase()} on
                  new bids.
                </p>
              </motion.div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
