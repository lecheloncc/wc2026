"use client";

type BarItem = {
  label: string;
  value: number;
  sublabel?: string;
};

type StatsBarChartProps = {
  items: BarItem[];
  maxValue?: number;
  valueLabel?: (v: number) => string;
  barColor?: string;
  emptyText?: string;
};

export function StatsBarChart({
  items,
  maxValue,
  valueLabel,
  barColor = "bg-brand-gold",
  emptyText = "No data yet.",
}: StatsBarChartProps) {
  if (!items.length) {
    return <p className="text-slate-500 text-xs py-2">{emptyText}</p>;
  }

  const max = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-slate-300 w-[160px] shrink-0 truncate leading-tight">
            {item.label}
            {item.sublabel && (
              <span className="text-slate-500 ml-1 text-[10px]">{item.sublabel}</span>
            )}
          </span>
          <div className="flex-1 bg-pitch-bg rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${barColor} transition-all`}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
          <span className="text-xs font-mono text-slate-300 w-8 text-right shrink-0">
            {valueLabel ? valueLabel(item.value) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
