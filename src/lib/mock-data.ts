export type Category = "materials" | "labor" | "tasks";

export interface LineItem {
  id: string;
  name: string;
  unit: string;
  plannedQty: number;
  plannedCost: number;
  actualQty: number;
  actualCost: number;
}

export interface Revision {
  id: string;
  timestamp: string;
  reason: string;
  category: Category;
  delta: number;
}

export interface Phase {
  id: string;
  name: string;
  status: "not-started" | "in-progress" | "complete";
  progress: number;
  originalPlan: Record<Category, number>;
  revisions: Revision[];
  items: Record<Category, LineItem[]>;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  startDate: string;
  targetDate: string;
  phases: Phase[];
}

export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  projectId: string;
  projectName: string;
  phaseName: string;
  title: string;
  detail: string;
  timestamp: string;
}

let seed = 42;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

const money = (n: number) => Math.round(n / 50) * 50;

function makeItems(
  category: Category,
  names: [string, string, number][],
  overrun: number,
  done: number,
): LineItem[] {
  return names.map(([name, unit, base], i) => {
    const plannedQty = Math.round(base);
    const rate = money(120 + rand() * 900);
    const plannedCost = plannedQty * rate;
    const factor = done === 0 ? 0 : overrun + (rand() - 0.5) * 0.18;
    const actualQty = done === 0 ? 0 : Math.round(plannedQty * done * (0.95 + rand() * 0.2));
    return {
      id: `${category}-${i}-${name.toLowerCase().replace(/\W+/g, "-")}`,
      name,
      unit,
      plannedQty,
      plannedCost,
      actualQty,
      actualCost: done === 0 ? 0 : money(plannedCost * done * factor),
    };
  });
}

function makePhase(
  id: string,
  name: string,
  done: number,
  overrun: number,
  revisions: Revision[],
  sets: Record<Category, [string, string, number][]>,
): Phase {
  const items: Record<Category, LineItem[]> = {
    materials: makeItems("materials", sets.materials, overrun, done),
    labor: makeItems("labor", sets.labor, overrun, done),
    tasks: makeItems("tasks", sets.tasks, overrun, done),
  };
  const originalPlan = {
    materials: Math.round(sum(items.materials.map((i) => i.plannedCost)) * 0.93),
    labor: Math.round(sum(items.labor.map((i) => i.plannedCost)) * 0.95),
    tasks: Math.round(sum(items.tasks.map((i) => i.plannedCost)) * 0.97),
  };
  return {
    id,
    name,
    status: done === 0 ? "not-started" : done >= 0.99 ? "complete" : "in-progress",
    progress: done,
    originalPlan,
    revisions,
    items,
  };
}

export const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const rev = (
  id: string,
  timestamp: string,
  reason: string,
  category: Category,
  delta: number,
): Revision => ({ id, timestamp, reason, category, delta });

const FOUNDATION = {
  materials: [
    ["Ready-mix concrete C30", "m³", 240],
    ["Rebar grade 500", "tonne", 18],
    ["Waterproof membrane", "roll", 60],
    ["Formwork plywood", "sheet", 140],
  ],
  labor: [
    ["Concrete crew", "day", 34],
    ["Steel fixers", "day", 22],
    ["Site supervision", "day", 40],
  ],
  tasks: [
    ["Excavation & spoil removal", "lot", 1],
    ["Pile cap pour", "lot", 1],
    ["Slab curing & testing", "lot", 1],
  ],
} as Record<Category, [string, string, number][]>;

const FRAMING = {
  materials: [
    ["Structural steel beams", "tonne", 96],
    ["Metal decking", "m²", 1800],
    ["Bolts & fixings", "box", 220],
  ],
  labor: [
    ["Steel erection crew", "day", 46],
    ["Crane operator", "day", 28],
    ["Welding inspection", "day", 12],
  ],
  tasks: [
    ["Column erection", "lot", 1],
    ["Deck installation", "lot", 1],
    ["Bolt torque verification", "lot", 1],
  ],
} as Record<Category, [string, string, number][]>;

const PLUMBING = {
  materials: [
    ["Copper pipe 22mm", "m", 1400],
    ["PVC waste stack", "m", 620],
    ["Valves & manifolds", "unit", 180],
    ["Insulation sleeving", "m", 900],
  ],
  labor: [
    ["Plumbing crew", "day", 52],
    ["Pressure testing tech", "day", 9],
  ],
  tasks: [
    ["Riser rough-in", "lot", 1],
    ["Fixture set-out", "lot", 1],
    ["Hydrostatic testing", "lot", 1],
  ],
} as Record<Category, [string, string, number][]>;

const ELECTRICAL = {
  materials: [
    ["Cable tray & conduit", "m", 2100],
    ["LV distribution boards", "unit", 22],
    ["Copper cabling", "m", 5400],
  ],
  labor: [
    ["Electrical crew", "day", 58],
    ["Commissioning engineer", "day", 14],
  ],
  tasks: [
    ["Containment install", "lot", 1],
    ["Panel termination", "lot", 1],
    ["Load testing", "lot", 1],
  ],
} as Record<Category, [string, string, number][]>;

const FACADE = {
  materials: [
    ["Curtain wall units", "unit", 320],
    ["Structural glazing sealant", "drum", 90],
    ["Aluminium mullions", "m", 1500],
  ],
  labor: [
    ["Glazing crew", "day", 42],
    ["Access & mast climber", "day", 30],
  ],
  tasks: [
    ["Setting out survey", "lot", 1],
    ["Panel hoisting", "lot", 1],
    ["Water penetration test", "lot", 1],
  ],
} as Record<Category, [string, string, number][]>;

const FITOUT = {
  materials: [
    ["Partition systems", "m²", 2400],
    ["Acoustic ceiling tiles", "m²", 3100],
    ["Engineered flooring", "m²", 2800],
  ],
  labor: [
    ["Joinery crew", "day", 60],
    ["Painting crew", "day", 38],
  ],
  tasks: [
    ["Level 3 partitions", "lot", 1],
    ["Snagging & handover", "lot", 1],
  ],
} as Record<Category, [string, string, number][]>;

export const projects: Project[] = [
  {
    id: "harborview",
    name: "Harborview Residences",
    client: "Meridian Living Group",
    location: "Seattle, WA",
    startDate: "2025-11-04",
    targetDate: "2026-12-18",
    phases: [
      makePhase("foundation", "Foundation", 1, 1.06, [
        rev("r1", "2025-12-02T09:20:00Z", "Rock encountered at 4.2m — extra excavation and piling", "labor", 82000),
        rev("r2", "2025-12-19T14:05:00Z", "Concrete supplier price escalation (Q1 index)", "materials", 46500),
      ], FOUNDATION),
      makePhase("framing", "Framing", 0.82, 1.03, [
        rev("r3", "2026-02-11T11:40:00Z", "Steel tonnage increased after structural re-check", "materials", 61000),
      ], FRAMING),
      makePhase("plumbing", "Plumbing", 0.54, 1.19, [
        rev("r4", "2026-04-08T08:15:00Z", "Riser route redesign around new lift core", "labor", 54000),
        rev("r5", "2026-05-21T16:30:00Z", "Copper commodity spike", "materials", 38000),
      ], PLUMBING),
      makePhase("electrical", "Electrical", 0.31, 0.97, [], ELECTRICAL),
      makePhase("facade-glazing", "Facade & Glazing", 0.12, 1.08, [
        rev("r6", "2026-06-30T10:00:00Z", "Client upgrade to low-E structural glazing", "materials", 129000),
      ], FACADE),
      makePhase("fit-out-l3", "Fit-out — Level 3 (custom)", 0, 1, [], FITOUT),
    ],
  },
  {
    id: "northgate",
    name: "Northgate Logistics Hub",
    client: "Ardent Industrial REIT",
    location: "Reno, NV",
    startDate: "2025-08-12",
    targetDate: "2026-10-02",
    phases: [
      makePhase("foundation", "Foundation", 1, 0.98, [
        rev("n1", "2025-09-14T09:00:00Z", "Slab thickness value-engineered down", "materials", -34000),
      ], FOUNDATION),
      makePhase("framing", "Framing", 1, 1.02, [], FRAMING),
      makePhase("plumbing", "Plumbing", 0.76, 1.22, [
        rev("n2", "2026-03-03T13:20:00Z", "Additional trade waste interceptor required by code", "materials", 51000),
      ], PLUMBING),
      makePhase("electrical", "Electrical", 0.61, 1.11, [
        rev("n3", "2026-04-19T15:45:00Z", "EV charging provision added (24 bays)", "materials", 96000),
      ], ELECTRICAL),
      makePhase("dock-levelers", "Dock Levelers (custom)", 0.4, 1.04, [], FITOUT),
    ],
  },
  {
    id: "cedar-medical",
    name: "Cedar Street Medical Center",
    client: "Northwell Health Partners",
    location: "Austin, TX",
    startDate: "2026-01-19",
    targetDate: "2027-05-30",
    phases: [
      makePhase("foundation", "Foundation", 1, 1.01, [], FOUNDATION),
      makePhase("framing", "Framing", 0.68, 0.96, [
        rev("c1", "2026-05-06T12:00:00Z", "Bulk steel pre-purchase saved on rate", "materials", -42000),
      ], FRAMING),
      makePhase("plumbing", "Plumbing", 0.42, 1.24, [
        rev("c2", "2026-06-11T09:35:00Z", "Medical gas piping upgraded to hospital spec", "materials", 118000),
        rev("c3", "2026-07-02T10:10:00Z", "Extra certified pipefitters mobilized", "labor", 67000),
      ], PLUMBING),
      makePhase("electrical", "Electrical", 0.22, 1.05, [], ELECTRICAL),
      makePhase("cleanroom", "Imaging Suite Shielding (custom)", 0.05, 1.02, [], FITOUT),
    ],
  },
  {
    id: "riverside-school",
    name: "Riverside Academy Expansion",
    client: "Riverside Unified District",
    location: "Portland, OR",
    startDate: "2025-06-02",
    targetDate: "2026-09-11",
    phases: [
      makePhase("foundation", "Foundation", 1, 0.99, [], FOUNDATION),
      makePhase("framing", "Framing", 1, 1.01, [], FRAMING),
      makePhase("plumbing", "Plumbing", 0.9, 0.94, [
        rev("s1", "2026-02-27T11:15:00Z", "Prefab bathroom pods reduced site plumbing", "labor", -58000),
      ], PLUMBING),
      makePhase("electrical", "Electrical", 0.84, 1.14, [
        rev("s2", "2026-05-15T14:25:00Z", "AV and network scope expanded across 14 classrooms", "materials", 74000),
      ], ELECTRICAL),
      makePhase("playfield", "Playfield & Landscaping (custom)", 0.35, 1.07, [], FITOUT),
    ],
  },
];

/* ------------------------------- computations ------------------------------ */

export const catTotals = (phase: Phase, key: "plannedCost" | "actualCost") => ({
  materials: sum(phase.items.materials.map((i) => i[key])),
  labor: sum(phase.items.labor.map((i) => i[key])),
  tasks: sum(phase.items.tasks.map((i) => i[key])),
});

export const phasePlanned = (phase: Phase) => {
  const t = catTotals(phase, "plannedCost");
  return t.materials + t.labor + t.tasks;
};
export const phaseActual = (phase: Phase) => {
  const t = catTotals(phase, "actualCost");
  return t.materials + t.labor + t.tasks;
};
export const phaseOriginal = (phase: Phase) =>
  phase.originalPlan.materials + phase.originalPlan.labor + phase.originalPlan.tasks;

/** Variance = actual vs the pro-rated current plan for work completed. */
export const phaseVariancePct = (phase: Phase) => {
  const expected = phasePlanned(phase) * (phase.progress || 0);
  if (expected <= 0) return 0;
  return ((phaseActual(phase) - expected) / expected) * 100;
};

export const projectPlanned = (p: Project) => sum(p.phases.map(phasePlanned));
export const projectActual = (p: Project) => sum(p.phases.map(phaseActual));
export const projectOriginal = (p: Project) => sum(p.phases.map(phaseOriginal));
export const projectProgress = (p: Project) => {
  const total = projectPlanned(p);
  if (!total) return 0;
  return sum(p.phases.map((ph) => phasePlanned(ph) * ph.progress)) / total;
};
export const projectVariancePct = (p: Project) => {
  const expected = projectPlanned(p) * projectProgress(p);
  if (expected <= 0) return 0;
  return ((projectActual(p) - expected) / expected) * 100;
};

export const itemVariancePct = (i: LineItem) => {
  if (!i.plannedCost) return 0;
  return ((i.actualCost - i.plannedCost) / i.plannedCost) * 100;
};

export const varianceTone = (pct: number) =>
  pct > 8 ? "critical" : pct > 2 ? "warning" : pct < -2 ? "good" : "neutral";

export const formatMoney = (n: number, compact = false) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(n);

export function buildAlerts(list: Project[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  list.forEach((p) => {
    p.phases.forEach((ph) => {
      const v = phaseVariancePct(ph);
      if (v > 15) {
        alerts.push({
          id: `${p.id}-${ph.id}-crit`,
          severity: "critical",
          projectId: p.id,
          projectName: p.name,
          phaseName: ph.name,
          title: `${ph.name} running ${v.toFixed(1)}% over plan`,
          detail: `Actuals of ${formatMoney(phaseActual(ph), true)} exceed the pro-rated current plan at ${Math.round(ph.progress * 100)}% completion.`,
          timestamp: "2026-08-28T07:40:00Z",
        });
      } else if (v > 7) {
        alerts.push({
          id: `${p.id}-${ph.id}-warn`,
          severity: "warning",
          projectId: p.id,
          projectName: p.name,
          phaseName: ph.name,
          title: `${ph.name} trending ${v.toFixed(1)}% over`,
          detail: `Cost curve is drifting above plan. Review open commitments before the next draw.`,
          timestamp: "2026-08-27T15:10:00Z",
        });
      }
      if (ph.revisions.length >= 2) {
        alerts.push({
          id: `${p.id}-${ph.id}-rev`,
          severity: "info",
          projectId: p.id,
          projectName: p.name,
          phaseName: ph.name,
          title: `${ph.revisions.length} plan revisions logged`,
          detail: ph.revisions[ph.revisions.length - 1].reason,
          timestamp: ph.revisions[ph.revisions.length - 1].timestamp,
        });
      }
    });
  });
  const order = { critical: 0, warning: 1, info: 2 };
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]);
}
