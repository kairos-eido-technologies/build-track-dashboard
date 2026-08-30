import * as React from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Bell,
  HardHat,
  LayoutDashboard,
  LineChart,
  Moon,
  Plus,
  Search,
  Sun,
  X,
  TriangleAlert,
  Info,
  CircleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useStore, useTheme } from "@/lib/store";
import { buildAlerts, type AlertItem } from "@/lib/mock-data";
import { Panel } from "@/components/kit";

export function severityMeta(sev: AlertItem["severity"]) {
  if (sev === "critical")
    return { color: "text-critical", bg: "bg-critical/12 border-critical/30", Icon: CircleAlert };
  if (sev === "warning")
    return { color: "text-warning", bg: "bg-warning/12 border-warning/30", Icon: TriangleAlert };
  return { color: "text-primary", bg: "bg-primary/10 border-primary/25", Icon: Info };
}

function NavLink({ to, icon: Icon, label }: { to: string; icon: typeof Bell; label: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
  return (
    <Link
      to={to}
      className={cn(
        "relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-lg border border-primary/25 bg-primary/12"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      )}
      <Icon className="relative z-10 h-4 w-4" />
      <span className="relative z-10 hidden sm:inline">{label}</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { projects, addProject } = useStore();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [alertsOpen, setAlertsOpen] = React.useState(false);
  const [newOpen, setNewOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [form, setForm] = React.useState({ name: "", client: "", location: "" });

  const alerts = React.useMemo(() => buildAlerts(projects), [projects]);
  const critical = alerts.filter((a) => a.severity === "critical").length;

  const results = query.trim()
    ? projects.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.client.toLowerCase().includes(query.toLowerCase()) ||
          p.phases.some((ph) => ph.name.toLowerCase().includes(query.toLowerCase())),
      )
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 surface-grid opacity-[0.5]" />
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-[420px]"
        style={{
          background:
            "radial-gradient(60% 100% at 20% 0%, color-mix(in oklab, var(--ember) 16%, transparent), transparent 70%)",
        }}
      />

      <header className="sticky top-0 z-40 glass border-b">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 lg:px-8">
          <Link to="/" className="mr-2 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-[var(--ember-glow)] text-primary-foreground ember-glow">
              <HardHat className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Build<span className="text-primary">Track</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            <NavLink to="/" icon={LayoutDashboard} label="Portfolio" />
            <NavLink to="/analysis" icon={LineChart} label="Insights" />
            <NavLink to="/alerts" icon={Bell} label="Alerts" />
          </nav>

          <div className="relative ml-auto hidden w-64 md:block lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects, phases…"
              className="h-9 bg-surface-2/60 pl-9"
            />
            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl glass p-1"
                >
                  {results.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setQuery("");
                        navigate({ to: "/project/$projectId", params: { projectId: p.id } });
                      }}
                      className="flex w-full flex-col items-start rounded-lg px-3 py-2 text-left text-sm hover:bg-primary/10"
                    >
                      <span className="font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.client}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setAlertsOpen(true)}
            aria-label="Open alerts"
            className="relative grid h-9 w-9 place-items-center rounded-lg border bg-surface-2/50 transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Bell className="h-4 w-4" />
            {alerts.length > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-critical px-1 text-[10px] font-bold text-white">
                {critical || alerts.length}
              </span>
            )}
          </button>

          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-lg border bg-surface-2/50 transition-colors hover:border-primary/40 hover:text-primary"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Button onClick={() => setNewOpen(true)} className="h-9 gap-1.5 font-semibold">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Project</span>
          </Button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-[1500px] px-4 py-8 lg:px-8">{children}</main>

      {/* Alerts slideout */}
      <AnimatePresence>
        {alertsOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setAlertsOpen(false)}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col glass border-l"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold">Alerts</h2>
                  <p className="text-xs text-muted-foreground">
                    {alerts.length} active signals across {projects.length} projects
                  </p>
                </div>
                <button
                  onClick={() => setAlertsOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg border hover:text-primary"
                  aria-label="Close alerts"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {alerts.map((a, i) => (
                  <AlertRow
                    key={a.id}
                    alert={a}
                    index={i}
                    onOpen={() => {
                      setAlertsOpen(false);
                      navigate({ to: "/project/$projectId", params: { projectId: a.projectId } });
                    }}
                  />
                ))}
              </div>
              <div className="border-t p-4">
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => {
                    setAlertsOpen(false);
                    navigate({ to: "/alerts" });
                  }}
                >
                  Open full alerts view
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* New project dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="glass sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">New project</DialogTitle>
            <DialogDescription>
              Create a project shell, then add your own named phases.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="np-name">Project name</Label>
              <Input
                id="np-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Lakeshore Tower B"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-client">Client</Label>
              <Input
                id="np-client"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Meridian Living Group"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-loc">Location</Label>
              <Input
                id="np-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Denver, CO"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!form.name.trim()}
              onClick={() => {
                const id = addProject(form.name.trim(), form.client, form.location);
                setNewOpen(false);
                setForm({ name: "", client: "", location: "" });
                toast.success("Project created", { description: "Add phases to start tracking." });
                navigate({ to: "/project/$projectId", params: { projectId: id } });
              }}
            >
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AlertRow({
  alert,
  index = 0,
  onOpen,
}: {
  alert: AlertItem;
  index?: number;
  onOpen?: () => void;
}) {
  const { color, bg, Icon } = severityMeta(alert.severity);
  return (
    <motion.button
      onClick={onOpen}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35 }}
      className="w-full text-left"
    >
      <Panel className={cn("lift border p-4", bg)}>
        <div className="flex gap-3">
          <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
          <div className="min-w-0">
            <div className="text-sm font-semibold">{alert.title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {alert.projectName} · {alert.phaseName}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{alert.detail}</p>
          </div>
        </div>
      </Panel>
    </motion.button>
  );
}
