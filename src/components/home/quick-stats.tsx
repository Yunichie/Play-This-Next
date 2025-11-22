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
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Playtime",
      value: formatPlaytime(totalPlaytime),
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Backlog",
      value: backlogCount,
      icon: ListTodo,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Playing",
      value: playingCount,
      icon: Gamepad2,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Completed",
      value: completedCount,
      icon: CheckCircle2,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-500/10",
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
            transition={{
              delay: index * 0.1,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
          >
            <Card className="relative overflow-hidden glass border-border/50 hover:shadow-lg transition-all group">
              <div
                className={`absolute inset-0 ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <CardHeader className="pb-2 relative">
                <div
                  className={`inline-flex p-2.5 rounded-xl ${stat.bgColor} w-fit mb-2`}
                >
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <motion.div
                  className="text-3xl font-bold tracking-tight"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                >
                  {stat.value}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
