"use client";

import { format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { week_start: string; shipments: number };

export function VolumeChart({ data }: { data: Point[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-ink-muted">No tenders in the last 12 weeks.</p>;
  }

  return (
    <div className="mt-4 h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke="#e2e8f0" />
          <XAxis
            dataKey="week_start"
            tickFormatter={(v: string) => format(parseISO(v), "MMM d")}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip
            labelFormatter={(v: string) => `Week of ${format(parseISO(v), "MMM d, yyyy")}`}
            formatter={(value: number) => [value, "Shipments"]}
          />
          <Bar dataKey="shipments" fill="#dc6624" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
