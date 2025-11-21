"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Library, Clock, ListTodo, CheckCircle2, Gamepad2 } from "lucide-react";
import { formatPlaytime } from "@/lib/utils";
import { motion } from "framer-motion";

interface QuickStatsProps {
  totalGames: number;
  totalPlaytime: number;
  backlogCount: number;
  completedCount: number;
  playingCount: number;
}

export function QuickStats({
  totalGames,
  totalPlaytime,
  backlogCount,
  completedCount,
  playingCount,
}: QuickStatsProps) {
  const stats = [
    {
      title: "Total Games",
      value: totalGames,
      icon: Library,
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      title: "Total Playtime",
      value: formatPlaytime(totalPlaytime),
      icon: Clock,
      gradient: "from-purple-500 to-pink-500",
    },
    {
      title: "Backlog",
      value: backlogCount,
      icon: ListTodo,
      gradient: "from-orange-500 to-red-500",
    },
    {
      title: "Currently Playing",
      value: playingCount,
      icon: Gamepad2,
      gradient: "from-green-500 to-emerald-500",
    },
    {
      title: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      gradient: "from-indigo-500 to-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div
                className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`}
              />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
