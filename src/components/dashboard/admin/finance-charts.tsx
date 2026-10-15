"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyFlow } from "@/lib/api";
import { formatCompactMoney, formatMoney, formatMonth } from "@/lib/format";

/*
 * Графикийн дүрэм (нэг цуваа → нэг өнгө, нарийн багана, сул дэвсгэр):
 *  - өнгө: --chart-series (брэндийн navy-ийн өнгөний, цагаан гадаргуу дээр 3:1-ээс дээш
 *    ялгарах шат; globals.css). Текст өгөгдлийн өнгийг өмсөхгүй — үргэлж текстийн токен.
 *  - утга бүрийг tooltip-гүйгээр уншиж болно: графикийн доорх хүснэгт ижил тоог харуулна.
 */

const AXIS_TICK = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

/**
 * Тэнхлэгийн цэвэр тэмдэглэгээ: алхам нь 1 / 2 / 2.5 / 5 × 10ⁿ (0, 1 сая, 2 сая …).
 * Recharts-ийн автомат алхам "850 мян, 1.7 сая" гэх мэт уншихад төвөгтэй тоо гаргадаг.
 */
export function niceTicks(min: number, max: number, target = 4): number[] {
  const lo = Math.min(0, min);
  const hi = Math.max(0, max);
  const span = hi - lo;
  if (span <= 0) return [0, 1];
  const rough = span / target;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? 10 * pow;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}

function FlowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: MonthlyFlow }>;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-muted-foreground">{formatMonth(row.month)}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{formatMoney(row.net)}</p>
      {row.refunded > 0 && (
        <p className="mt-1 text-muted-foreground">
          Орсон {formatMoney(row.collected)} · буцаасан {formatMoney(row.refunded)}
        </p>
      )}
    </div>
  );
}

/** Сар бүрийн цэвэр орлого (орсон − буцаасан). Зөвхөн сүүлийн сарын утгыг шошголно. */
export function MonthlyRevenueChart({ data }: { data: MonthlyFlow[] }) {
  const rows = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  const last = rows.length - 1;
  const values = rows.map((r) => r.net);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));

  return (
    // Өндөр нь X тэнхлэгийн шошгыг багтаана (доторх гүйлгэгч үүсэхгүй)
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 20, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            tick={AXIS_TICK}
            interval="preserveStartEnd"
          />
          <YAxis
            width={60}
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={(v: number) => formatCompactMoney(v)}
            ticks={ticks}
            domain={[ticks[0], ticks[ticks.length - 1]]}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.7 }}
            content={<FlowTooltip />}
            isAnimationActive={false}
          />
          <Bar
            dataKey="net"
            fill="var(--chart-series)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="net"
              position="top"
              content={(props) => {
                const { x, y, width, value, index } = props as {
                  x?: number | string;
                  y?: number | string;
                  width?: number | string;
                  value?: number | string;
                  index?: number;
                };
                if (index !== last || !Number(value)) return null;
                return (
                  <text
                    x={Number(x) + Number(width) / 2}
                    y={Number(y) - 6}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill="var(--foreground)"
                  >
                    {formatCompactMoney(Number(value))}
                  </text>
                );
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface BarListRow {
  key: string;
  label: string;
  value: number;
  /** Утгын доорх тайлбар (жишээ: "2 сурагч · буцаалт 50,000₮") */
  sub?: string;
}

/**
 * Хэмжээг харьцуулах хэвтээ баганууд (курс, төлбөрийн хэлбэрээр). Нэрлэсэн ангилал тул
 * бүх багана ИЖИЛ өнгөтэй — утгаар нь өнгө ялгахгүй. Мөр бүр нэр, тодорхой дүнгээ
 * харуулдаг тул tooltip шаардлагагүй.
 */
export function BarList({ rows }: { rows: BarListRow[] }) {
  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  return (
    <ul className="space-y-3.5">
      {rows.map((r) => (
        <li key={r.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-foreground">{r.label}</span>
            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
              {formatMoney(r.value)}
            </span>
          </div>
          {/* Суурь талдаа тэгш, өгөгдлийн төгсгөлдөө 4px дугуйрсан нарийн багана */}
          <div className="mt-1.5 h-2">
            <div
              className="h-full rounded-r-[4px] bg-(--chart-series)"
              style={{ width: `${Math.max(0, (r.value / max) * 100)}%`, minWidth: r.value > 0 ? 2 : 0 }}
            />
          </div>
          {r.sub && <p className="mt-1 text-xs text-muted-foreground">{r.sub}</p>}
        </li>
      ))}
    </ul>
  );
}
