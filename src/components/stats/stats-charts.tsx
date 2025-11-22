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
import { motion } from "framer-motion";

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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass border border-border/50 rounded-xl p-3 shadow-lg">
        <p className="font-semibold">{payload[0].name}</p>
        <p className="text-sm text-muted-foreground">
          {payload[0].value} {payload[0].name === "hours" ? "hours" : "games"}
        </p>
      </div>
    );
  }
  return null;
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
      {/* Pie Chart */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Games by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-xl">Top 5 by Playtime</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={playtimeData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="hours"
                  fill="hsl(var(--primary))"
                  radius={[12, 12, 0, 0]}
                  animationBegin={0}
                  animationDuration={800}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
