"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function ExportDataButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: games } = await supabase
        .from("user_games")
        .select("*")
        .eq("user_id", user.id);

      const exportData = {
        exported_at: new Date().toISOString(),
        profile,
        games,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `play-this-next-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button onClick={handleExport} disabled={exporting} variant="outline">
      <Download className="w-4 h-4 mr-2" />
      {exporting ? "Exporting..." : "Export Data"}
    </Button>
  );
}
