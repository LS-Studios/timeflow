
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  user: { name: string; email: string };
  onLogout: () => void;
}

export function ProfileDialog({
  isOpen,
  onOpenChange,
  user,
  onLogout,
}: ProfileDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center space-y-4">
            <div className="p-3 bg-muted rounded-full">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <DialogTitle>{user.name}</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </div>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
            <Button variant="destructive" onClick={onLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
