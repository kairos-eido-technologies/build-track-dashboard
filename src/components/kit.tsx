import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { cn } from "@/lib/utils";
import { formatMoney, varianceTone } from "@/lib/mock-data";

/* ----------------------------- Animated number ---------------------------- */

export function AnimatedNumber({
  value,
  format = (n: number) => n.toFixed(0),
  className,
  duration = 1.1,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
  duration?: number;
}) {
  const [display, setDisplay] = React.useState(0);

  React.useEffect(() => {
    const controls = animate(display, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(v),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className={cn("num", className)}>{format(display)}</span>;
}

export const MoneyCounter = ({
  value,
  compact = true,
  className,
}: {
  value: number;
  compact?: boolean;
  className?: string;
}) => <AnimatedNumber value={value} className={className} format={(n) => formatMoney(n, compact)} />;

export const PercentCounter = ({ value, className }: { value: number; className?: string }) => (
  <AnimatedNumber
    value={value}
    className={className}
    format={(n) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`}
  />
);

/* --------------------------------- Tilt card ------------------------------- */

export function TiltCard({
  children,
  className,
  intensity = 6,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22 });
  const sy = useSpring(y, { stiffness: 220, damping: 22 });
  const rotateX = useTransform(sy, [-0.5, 0.5], [intensity, -intensity]);
  const rotateY = useTransform(sx, [-0.5, 0.5], [-intensity, intensity]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className={cn("will-change-transform", className)}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------- Panel --------------------------------- */

export const Panel = ({
  children,
  className,
  glow = false,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) => (
  <div
    className={cn(
      "glass rounded-2xl shadow-[0_20px_50px_-40px_rgba(0,0,0,0.9)]",
      glow && "ember-glow",
      className,
    )}
  >
    {children}
  </div>
);

/* ------------------------------- Status ring ------------------------------- */

export function StatusRing({
  progress,
  variancePct = 0,
  size = 96,
  stroke = 9,
  label,
  sublabel,
}: {
  progress: number;
  variancePct?: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tone = varianceTone(variancePct);
  const color =
    tone === "critical"
      ? "var(--critical)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "good"
          ? "var(--good)"
          : "var(--ember)";

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size, perspective: 600 }}
    >
      <motion.svg
        width={size}
        height={size}
        initial={{ rotateX: 42, opacity: 0 }}
        animate={{ rotateX: 14, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: "preserve-3d" }}
        className="-rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="color-mix(in oklab, var(--foreground) 12%, transparent)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, progress))) }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </motion.svg>
      <div className="absolute text-center leading-none">
        <div className="num text-base font-semibold" style={{ color }}>
          {label ?? `${Math.round(progress * 100)}%`}
        </div>
        {sublabel && (
          <div className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------ Variance badge ----------------------------- */

export function VarianceBadge({
  pct,
  className,
  showIcon = true,
}: {
  pct: number;
  className?: string;
  showIcon?: boolean;
}) {
  const tone = varianceTone(pct);
  const map = {
    critical: "bg-critical/15 text-critical border-critical/30",
    warning: "bg-warning/15 text-warning border-warning/30",
    good: "bg-good/15 text-good border-good/30",
    neutral: "bg-muted text-muted-foreground border-border",
  } as const;
  return (
    <span
      className={cn(
        "num inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
        map[tone],
        className,
      )}
    >
      {showIcon && <span>{pct > 0 ? "▲" : pct < 0 ? "▼" : "■"}</span>}
      {pct > 0 ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

/* ------------------------------- Progress bar ------------------------------ */

export function DualBar({
  planned,
  actual,
  className,
}: {
  planned: number;
  actual: number;
  className?: string;
}) {
  const max = Math.max(planned, actual, 1);
  const over = actual > planned;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-foreground/35"
          initial={{ width: 0 }}
          animate={{ width: `${(planned / max) * 100}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: over
              ? "linear-gradient(90deg, var(--ember), var(--critical))"
              : "linear-gradient(90deg, var(--ember), var(--ember-glow))",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${(actual / max) * 100}%` }}
          transition={{ duration: 1.2, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/* --------------------------------- Section -------------------------------- */

export const SectionTitle = ({
  eyebrow,
  title,
  right,
}: {
  eyebrow?: string;
  title: string;
  right?: React.ReactNode;
}) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <div>
      {eyebrow && (
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </div>
      )}
      <h2 className="text-xl font-bold">{title}</h2>
    </div>
    {right}
  </div>
);

/* -------------------------- Isometric empty state ------------------------- */

export function EmptyState({
  title = "Nothing here yet",
  message = "Add a phase to start tracking planned vs actual cost.",
  action,
}: {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <Panel className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <CraneIllustration />
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      </div>
      {action}
    </Panel>
  );
}

export function CraneIllustration({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 260 200"
      className={cn("h-44 w-64", className)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <g opacity="0.9">
        <path d="M40 150 L130 100 L220 150 L130 200 Z" fill="var(--surface-2)" />
        <path d="M70 132 L130 97 L190 132 L130 167 Z" fill="var(--muted)" opacity="0.7" />
        {/* building blocks */}
        <path d="M100 120 L130 103 L160 120 L160 150 L130 167 L100 150 Z" fill="var(--surface)" />
        <path d="M130 103 L160 120 L160 150 L130 133 Z" fill="var(--secondary)" />
        <path d="M100 120 L130 137 L130 167 L100 150 Z" fill="var(--surface-2)" />
        <path d="M110 100 L130 88 L150 100 L150 118 L130 130 L110 118 Z" fill="var(--accent)" opacity="0.65" />
        {/* crane mast */}
        <rect x="196" y="40" width="6" height="102" fill="var(--ember)" />
        <motion.g
          initial={{ rotate: -4 }}
          animate={{ rotate: 4 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          style={{ originX: "199px", originY: "44px" }}
        >
          <rect x="110" y="41" width="120" height="5" fill="var(--ember)" />
          <line x1="140" y1="44" x2="140" y2="86" stroke="var(--ember-glow)" strokeWidth="1.6" />
          <rect x="132" y="86" width="17" height="12" fill="var(--ember-glow)" />
        </motion.g>
        <line x1="199" y1="46" x2="230" y2="44" stroke="var(--ember)" strokeWidth="1.5" />
      </g>
    </motion.svg>
  );
}

/* --------------------------------- Skeleton ------------------------------- */

export const Shimmer = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden rounded-lg bg-foreground/8", className)}>
    <motion.div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(90deg, transparent, color-mix(in oklab, var(--foreground) 10%, transparent), transparent)",
      }}
      animate={{ x: ["-100%", "100%"] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
    />
  </div>
);

export const CardSkeleton = () => (
  <Panel className="space-y-4 p-5">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <Shimmer className="h-5 w-40" />
        <Shimmer className="h-3 w-24" />
      </div>
      <Shimmer className="h-20 w-20 rounded-full" />
    </div>
    <Shimmer className="h-2 w-full" />
    <Shimmer className="h-2 w-3/4" />
    <div className="grid grid-cols-3 gap-3 pt-2">
      <Shimmer className="h-10" />
      <Shimmer className="h-10" />
      <Shimmer className="h-10" />
    </div>
  </Panel>
);
