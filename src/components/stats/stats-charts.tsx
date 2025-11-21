"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { formatPlaytime } from "@/lib/utils";

interface StatsChartsProps {
  statusDistribution: Record<string, number>;
  mostPlayed: Array<{ name: string; playtime_forever: number }>;
}

const STATUS_COLORS = {
  backlog: "#f59e0b",
  playing: "#10b981",
  completed: "#3b82f6",
  dropped: "#ef4444",
  shelved: "#6b7280",
};

export function StatsCharts({
  statusDistribution,
  mostPlayed,
}: StatsChartsProps) {
  const statusData = Object.entries(statusDistribution).map(
    ([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#6b7280",
    }),
  );

  const playtimeData = mostPlayed.slice(0, 5).map((game) => ({
    name:
      game.name.length > 20 ? game.name.substring(0, 20) + "..." : game.name,
    hours: Math.round(game.playtime_forever / 60),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {}
      <Card>
        <CardHeader>
          <CardTitle>Games by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 by Playtime</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={playtimeData}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => [`${value} hours`, "Playtime"]}
              />
              <Bar dataKey="hours" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
