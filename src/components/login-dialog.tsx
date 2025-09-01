
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AtSign, KeyRound } from "lucide-react";
import { Logo } from "./logo";
import { useTranslation } from "@/lib/i18n";

interface LoginDialogProps {
  onLogin: (user: { name: string; email: string }) => void;
}

export function LoginDialog({ onLogin }: LoginDialogProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("max.mustermann@musterfirma.de");
  const [password, setPassword] = useState("password123");

  const handleLogin = () => {
    // Simulate login
    if (email && password) {
      onLogin({
        name: "Max Mustermann",
        email: email,
      });
    }
  };

  return (
    <Dialog open={true} modal={true}>
      <DialogContent 
        className="sm:max-w-md" 
        hideCloseButton={true}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center text-center">
          <Logo />
          <DialogTitle className="text-2xl pt-4">Welcome back</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
               <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleLogin} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            Login
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
