"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  profit: number;
  orders: number;
}

export function DashboardCharts({ monthlySales }: { monthlySales: MonthlyData[] }) {
  const hasData = monthlySales.some((m) => m.revenue > 0);

  if (!hasData) {
    return (
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="text-sm font-medium mb-2">Monthly Revenue</h2>
        <p className="text-sm text-muted-fg">No sales data yet. Create your first sale to see charts.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h2 className="text-sm font-medium mb-4">Monthly Revenue</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlySales} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#71717a" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e4e4e7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
              formatter={(value: number | undefined) => value != null ? [`₹${value.toLocaleString("en-IN")}`, undefined] : ["", undefined]}
            />
            <Bar dataKey="revenue" fill="#18181b" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="profit" fill="#a1a1aa" radius={[4, 4, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
