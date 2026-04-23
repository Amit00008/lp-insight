"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatQuarter } from "@/lib/format";

interface ChartDataPoint {
  date: string;
  nav: number;
  irr: number;
  tvpi: number;
  dpi: number;
}

export function FundPerformanceChart({ data }: { data: ChartDataPoint[] }) {
  const formatted = data.map((d) => ({
    ...d,
    label: formatQuarter(d.date),
    navM: d.nav / 1_000_000,
  }));

  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v.toFixed(1)}M`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(1)}x`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              fontSize: 12,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "NAV") return [`$${value.toFixed(2)}M`, name];
              if (name === "TVPI") return [`${value.toFixed(2)}x`, name];
              if (name === "DPI") return [`${value.toFixed(2)}x`, name];
              return [value, name];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar
            yAxisId="left"
            dataKey="navM"
            name="NAV"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={32}
            opacity={0.8}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="tvpi"
            name="TVPI"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 4, fill: "#10b981" }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dpi"
            name="DPI"
            stroke="#f59e0b"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: "#f59e0b" }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
