
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n.tsx";
import { Building, LogOut, CheckCircle, AlertTriangle } from "lucide-react";

interface OrganizationDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  currentOrganization?: string;
  onJoin: (serialNumber: string) => boolean; // Returns success
  onLeave: () => void;
}

export function OrganizationDialog({
  isOpen,
  onOpenChange,
  currentOrganization,
  onJoin,
  onLeave,
}: OrganizationDialogProps) {
  const { t } = useTranslation();
  const [serialNumber, setSerialNumber] = useState("");
  const [error, setError] = useState("");

  const handleJoin = () => {
    setError("");
    if (!serialNumber.trim()) {
      setError("Serial number cannot be empty.");
      return;
    }
    const success = onJoin(serialNumber);
    if (success) {
      onOpenChange(false);
      setSerialNumber("");
    } else {
      setError("Invalid serial number.");
    }
  };

  const handleLeave = () => {
    onLeave();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Building className="h-6 w-6" />
            <DialogTitle>
              {currentOrganization ? t('manage') : t('joinOrganization')}
            </DialogTitle>
          </div>
          <DialogDescription>
            {currentOrganization
              ? `${t('connectedTo')} ${currentOrganization}.`
              : t('joinOrganizationDescription')}
          </DialogDescription>
        </DialogHeader>

        {currentOrganization ? (
          <div className="py-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('leaveOrganization')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('leaveOrganizationConfirmation')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeave}>
                    {t('confirmLeave')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <>
            <div className="grid gap-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="serial-number">{t('serialNumber')}</Label>
                <Input
                  id="serial-number"
                  placeholder={t('serialNumberPlaceholder')}
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center text-sm text-destructive">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleJoin} className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('connect')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
