import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ClipboardPlus, History } from "lucide-react";
import { toast } from "sonner";
import { useProject, useStore } from "@/lib/store";
import {
  catTotals,
  formatMoney,
  itemVariancePct,
  phaseActual,
  phaseOriginal,
  phasePlanned,
  phaseVariancePct,
  varianceTone,
  type Category,
  type LineItem,
} from "@/lib/mock-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CardSkeleton,
  EmptyState,
  MoneyCounter,
  Panel,
  PercentCounter,
  SectionTitle,
  StatusRing,
  VarianceBadge,
} from "@/components/kit";

export const Route = createFileRoute("/project/$projectId/phase/$phaseId")({
  head: () => ({
    meta: [
      { title: "Phase line items — BuildTrack" },
      {
        name: "description",
        content:
          "Materials, labor and task line items with planned versus actual quantity and cost, plus the full revision history.",
      },
      { property: "og:title", content: "Phase line items — BuildTrack" },
      {
        property: "og:description",
        content: "Log actuals and review plan revisions for a construction phase.",
      },
    ],
  }),
  component: PhaseDetail,
});

const CATS: Category[] = ["materials", "labor", "tasks"];

function PhaseDetail() {
  const { projectId, phaseId } = Route.useParams();
  const project = useProject(projectId);
  const { loading, logActual } = useStore();
  const phase = project?.phases.find((p) => p.id === phaseId);
  const [tab, setTab] = React.useState<Category>("materials");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ itemId: "", qty: "", cost: "", note: "" });

  if (loading) return <CardSkeleton />;
  if (!project || !phase)
    return (
      <EmptyState
        title="Phase not found"
        message="This phase is no longer part of the project."
        action={
          <Link to="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
            Back to portfolio
          </Link>
        }
      />
    );

  const variance = phaseVariancePct(phase);
  const p = catTotals(phase, "plannedCost");
  const a = catTotals(phase, "actualCost");

  const openLog = (cat: Category) => {
    setTab(cat);
    setForm({ itemId: phase.items[cat][0]?.id ?? "", qty: "", cost: "", note: "" });
    setOpen(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Portfolio
        </Link>
        <span>/</span>
        <Link
          to="/project/$projectId"
          params={{ projectId }}
          className="inline-flex items-center gap-1 hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {project.name}
        </Link>
      </div>

      <motion.div
        layoutId={`phase-${phase.id}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-6"
      >
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            {project.name}
          </div>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight lg:text-4xl">{phase.name}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>
              Original <span className="num">{formatMoney(phaseOriginal(phase), true)}</span>
            </span>
            <span>
              Current plan <span className="num">{formatMoney(phasePlanned(phase), true)}</span>
            </span>
            <span>
              Actual <span className="num">{formatMoney(phaseActual(phase), true)}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Panel className="flex items-center gap-5 px-5 py-4">
            <StatusRing progress={phase.progress} variancePct={variance} size={86} sublabel="complete" />
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Phase variance
              </div>
              <div
                className={
                  "text-2xl font-bold " +
                  (variance > 7 ? "text-critical" : variance > 2 ? "text-warning" : "text-good")
                }
              >
                <PercentCounter value={variance} />
              </div>
            </div>
          </Panel>
          <Button className="h-11 gap-2 font-semibold" onClick={() => openLog(tab)}>
            <ClipboardPlus className="h-4 w-4" /> Log Actual
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel className="p-5">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Category)}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <TabsList className="bg-surface-2/60">
                {CATS.map((c) => (
                  <TabsTrigger key={c} value={c} className="capitalize">
                    {c}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span>
                  Planned <span className="num font-semibold text-foreground">{formatMoney(p[tab], true)}</span>
                </span>
                <span>
                  Actual <span className="num font-semibold text-foreground">{formatMoney(a[tab], true)}</span>
                </span>
              </div>
            </div>
            {CATS.map((c) => (
              <TabsContent key={c} value={c}>
                <ItemTable items={phase.items[c]} />
              </TabsContent>
            ))}
          </Tabs>
        </Panel>

        <Panel className="p-5">
          <SectionTitle
            eyebrow="Planning history"
            title="Revisions"
            right={<History className="h-4 w-4 text-muted-foreground" />}
          />
          {phase.revisions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No revisions logged. The current plan still matches the original plan.
            </p>
          ) : (
            <ol className="relative space-y-5 border-l pl-5">
              <AnimatePresence initial={false}>
                {[...phase.revisions].reverse().map((r, i) => (
                  <motion.li
                    key={r.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="relative"
                  >
                    <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary shadow-[0_0_10px_var(--ember)]" />
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {new Date(r.timestamp).toLocaleString()}
                      </span>
                      {r.delta !== 0 && (
                        <span
                          className={
                            "num rounded-full border px-2 py-0.5 text-[10px] font-bold " +
                            (r.delta > 0
                              ? "border-critical/30 bg-critical/12 text-critical"
                              : "border-good/30 bg-good/12 text-good")
                          }
                        >
                          {r.delta > 0 ? "+" : "−"}
                          {formatMoney(Math.abs(r.delta), true)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm">{r.reason}</p>
                    <span className="text-[11px] capitalize text-muted-foreground">{r.category}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </Panel>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Log actual — {phase.name}</DialogTitle>
            <DialogDescription>
              Recorded against the current plan and reflected immediately in variance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={tab}
                onValueChange={(v) => {
                  const cat = v as Category;
                  setTab(cat);
                  setForm((f) => ({ ...f, itemId: phase.items[cat][0]?.id ?? "" }));
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATS.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Line item</Label>
              <Select value={form.itemId} onValueChange={(v) => setForm({ ...form, itemId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a line item" />
                </SelectTrigger>
                <SelectContent>
                  {phase.items[tab].map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="qty">Quantity</Label>
                <Input
                  id="qty"
                  type="number"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                  placeholder="12"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost (USD)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="18500"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Second concrete pour — overtime crew"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.itemId || !form.cost}
              onClick={() => {
                logActual({
                  projectId,
                  phaseId,
                  category: tab,
                  itemId: form.itemId,
                  qty: Number(form.qty) || 0,
                  cost: Number(form.cost) || 0,
                  note: form.note,
                });
                setOpen(false);
                toast.success("Actual logged", {
                  description: `${formatMoney(Number(form.cost) || 0)} recorded against ${phase.name}.`,
                });
                setForm({ itemId: "", qty: "", cost: "", note: "" });
              }}
            >
              Save actual
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ItemTable({ items }: { items: LineItem[] }) {
  if (items.length === 0)
    return <EmptyState title="No line items" message="Add line items to this category." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
            <th className="py-2 text-left font-semibold">Item</th>
            <th className="py-2 text-right font-semibold">Plan qty</th>
            <th className="py-2 text-right font-semibold">Plan cost</th>
            <th className="py-2 text-right font-semibold">Actual qty</th>
            <th className="py-2 text-right font-semibold">Actual cost</th>
            <th className="py-2 text-right font-semibold">Variance</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i, idx) => {
            const v = itemVariancePct(i);
            const tone = varianceTone(v);
            return (
              <motion.tr
                key={i.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="border-b border-border/60 transition-colors hover:bg-primary/5"
              >
                <td className="py-3 pr-3">
                  <div className="font-medium">{i.name}</div>
                  <div className="text-[11px] text-muted-foreground">per {i.unit}</div>
                </td>
                <td className="num py-3 text-right text-muted-foreground">{i.plannedQty}</td>
                <td className="num py-3 text-right">{formatMoney(i.plannedCost)}</td>
                <td className="num py-3 text-right text-muted-foreground">{i.actualQty}</td>
                <td
                  className={
                    "num py-3 text-right font-semibold " +
                    (tone === "critical"
                      ? "text-critical"
                      : tone === "warning"
                        ? "text-warning"
                        : tone === "good"
                          ? "text-good"
                          : "")
                  }
                >
                  <MoneyCounter value={i.actualCost} compact={false} />
                </td>
                <td className="py-3 text-right">
                  <VarianceBadge pct={v} />
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
