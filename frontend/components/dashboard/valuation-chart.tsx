"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { formatQuarter } from "@/lib/format";

interface ValuationDataPoint {
  date: string;
  value: number;
  costBasis: number;
  label: string;
}

export function ValuationChart({ data }: { data: ValuationDataPoint[] }) {
  const costBasis = data[0]?.costBasis || 0;

  const formatted = data.map((d) => ({
    ...d,
    dateLabel: formatQuarter(d.date),
    valueK: d.value / 1000,
    costBasisK: costBasis / 1000,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e5e5" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${v}K`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e5e5",
              fontSize: 12,
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
            formatter={(value: number, name: string) => {
              if (name === "Value") return [`$${(value * 1000).toLocaleString()}`, name];
              return [`$${(value * 1000).toLocaleString()}`, name];
            }}
          />
          <ReferenceLine
            y={costBasis / 1000}
            stroke="#ef4444"
            strokeDasharray="5 5"
            strokeWidth={1.5}
            label={{
              value: "Cost Basis",
              position: "right",
              fill: "#ef4444",
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="valueK"
            name="Value"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#valueGradient)"
            dot={{ r: 4, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
