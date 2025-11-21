"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteAccountButton() {
  const [deleting, setDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signOut();

      if (error) {
        toast.error("Failed to delete account");
        return;
      }

      toast.success("Account deleted successfully");
      router.push("/login");
    } catch (error) {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you absolutely sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove all your data from our servers, including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>All game data and progress</li>
              <li>Reviews and ratings</li>
              <li>Preferences and settings</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Yes, delete my account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
