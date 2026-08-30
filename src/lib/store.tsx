import * as React from "react";
import {
  projects as seedProjects,
  type Category,
  type Project,
  type Revision,
} from "./mock-data";

interface LogActualInput {
  projectId: string;
  phaseId: string;
  category: Category;
  itemId: string;
  qty: number;
  cost: number;
  note: string;
}

interface Ctx {
  projects: Project[];
  loading: boolean;
  logActual: (input: LogActualInput) => void;
  addProject: (name: string, client: string, location: string) => string;
}

const StoreContext = React.createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>(seedProjects);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  const logActual = React.useCallback((input: LogActualInput) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== input.projectId) return p;
        return {
          ...p,
          phases: p.phases.map((ph) => {
            if (ph.id !== input.phaseId) return ph;
            const revision: Revision = {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              reason: input.note || "Actual cost logged from field",
              category: input.category,
              delta: 0,
            };
            return {
              ...ph,
              progress: Math.min(1, Math.max(ph.progress, 0.02)),
              status: ph.status === "not-started" ? "in-progress" : ph.status,
              revisions: [...ph.revisions, revision],
              items: {
                ...ph.items,
                [input.category]: ph.items[input.category].map((it) =>
                  it.id === input.itemId
                    ? {
                        ...it,
                        actualQty: it.actualQty + input.qty,
                        actualCost: it.actualCost + input.cost,
                      }
                    : it,
                ),
              },
            };
          }),
        };
      }),
    );
  }, []);

  const addProject = React.useCallback((name: string, client: string, location: string) => {
    const id = `${name.toLowerCase().replace(/\W+/g, "-")}-${Math.floor(Math.random() * 999)}`;
    setProjects((prev) => [
      ...prev,
      {
        id,
        name,
        client: client || "Unassigned client",
        location: location || "Location TBC",
        startDate: new Date().toISOString().slice(0, 10),
        targetDate: "2027-12-31",
        phases: [],
      },
    ]);
    return id;
  }, []);

  const value = React.useMemo(
    () => ({ projects, loading, logActual, addProject }),
    [projects, loading, logActual, addProject],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useProject(id: string) {
  const { projects } = useStore();
  return projects.find((p) => p.id === id);
}

/* ------------------------------- theme ------------------------------- */

const ThemeContext = React.createContext<{ theme: "dark" | "light"; toggle: () => void }>({
  theme: "dark",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<"dark" | "light">("dark");

  React.useEffect(() => {
    const stored = window.localStorage.getItem("buildtrack-theme");
    if (stored === "light" || stored === "dark") setTheme(stored);
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("buildtrack-theme", theme);
  }, [theme]);

  const value = React.useMemo(
    () => ({ theme, toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")) }),
    [theme],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => React.useContext(ThemeContext);
