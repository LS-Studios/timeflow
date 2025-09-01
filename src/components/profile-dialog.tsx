
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, RefreshCw } from "lucide-react";
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="items-center text-center">
            <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={`https://i.pravatar.cc/150?u=${user.email}`} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <DialogTitle>{user.name}</DialogTitle>
            <DialogDescription>{user.email}</DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col sm:justify-stretch gap-2 pt-4">
           <Button variant="outline" onClick={onLogout} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Switch Profile
            </Button>
            <Button variant="destructive" onClick={onLogout} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
