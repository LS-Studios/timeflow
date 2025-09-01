
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
import { LogIn, AtSign, KeyRound, User } from "lucide-react";
import { Logo } from "./logo";
import { useTranslation } from "@/lib/i18n";
import { Separator } from "./ui/separator";

interface LoginDialogProps {
  onLogin: (user: { name: string; email: string }) => void;
}

export function LoginDialog({ onLogin }: LoginDialogProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("Max Mustermann");
  const [email, setEmail] = useState("max.mustermann@musterfirma.de");
  const [password, setPassword] = useState("password123");

  const handleSubmit = () => {
    // Simulate login/registration
    if (email && password && (mode === 'login' || (mode === 'register' && name))) {
      onLogin({
        name: name,
        email: email,
      });
    }
  };
  
  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
  }

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
          <DialogTitle className="text-2xl pt-4">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'login' ? 'Enter your credentials to access your account.' : 'Fill in the details below to get started.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {mode === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="e.g. Max Mustermann"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}
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
          <Button onClick={handleSubmit} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
        </DialogFooter>
        
        <Separator />
        
        <div className="text-center text-sm">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <Button variant="link" className="pl-1.5" onClick={toggleMode}>
                {mode === 'login' ? "Sign up" : "Log in"}
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
