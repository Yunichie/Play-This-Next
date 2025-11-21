"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { syncSteamLibrary } from "@/app/actions/games";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LibraryHeaderProps {
  totalGames: number;
  backlogCount: number;
  playingCount: number;
  completedCount: number;
  droppedCount: number;
  favoriteCount: number;
}

export function LibraryHeader({
  totalGames,
  backlogCount,
  playingCount,
  completedCount,
  droppedCount,
  favoriteCount,
}: LibraryHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [syncing, setSyncing] = useState(false);
  const [searchValue, setSearchValue] = useState(
    searchParams.get("search") || "",
  );

  const currentStatus = searchParams.get("status") || "all";
  const currentSort = searchParams.get("sort") || "name";

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncSteamLibrary();

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Synced ${result.count} games from Steam!`);
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to sync library");
    } finally {
      setSyncing(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchValue) {
      params.set("search", searchValue);
    } else {
      params.delete("search");
    }
    router.push(`/library?${params.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    router.push(`/library?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", value);
    router.push(`/library?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Your Library</h1>
          <p className="text-muted-foreground mt-1">{totalGames} games total</p>
        </div>

        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw
            className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`}
          />
          {syncing ? "Syncing..." : "Sync Steam Library"}
        </Button>
      </div>

      {}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search games..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        <Select value={currentSort} onValueChange={handleSortChange}>
          <SelectTrigger className="w-full md:w-48">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="playtime">Most Played</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="recent">Recently Played</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {}
      <Tabs value={currentStatus} onValueChange={handleStatusChange}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All ({totalGames})</TabsTrigger>
          <TabsTrigger value="backlog">Backlog ({backlogCount})</TabsTrigger>
          <TabsTrigger value="playing">Playing ({playingCount})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedCount})
          </TabsTrigger>
          <TabsTrigger value="dropped">Dropped ({droppedCount})</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
