
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AtSign, KeyRound, User, Users, AlertTriangle } from "lucide-react";
import { Logo } from "./logo";
import { useTranslation } from "@/lib/i18n";
import { Separator } from "./ui/separator";
import { useAuth } from "@/lib/auth-provider";
import { Alert, AlertDescription } from "./ui/alert";

export function LoginDialog() {
  const { t } = useTranslation();
  const { login, register, loginAsGuest } = useAuth();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  
  const resetForm = () => {
      setName("");
      setEmail("");
      setPassword("");
      setError(null);
  }

  const handleSubmit = async () => {
    setError(null);
    let result;
    if (mode === 'login') {
      if (!email || !password) {
        setError("Please enter email and password.");
        return;
      }
      result = await login(email, password);
    } else { // register
      if (!name || !email || !password) {
        setError("Please fill in all fields.");
        return;
      }
      result = await register(name, email, password);
    }

    if (result && !result.success) {
      setError(result.message);
    }
  };
  
  const handleGuestLogin = () => {
    loginAsGuest();
  }

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    resetForm();
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
                  autoComplete="name"
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
                autoComplete="email"
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
                autoComplete={mode === 'login' ? "current-password" : "new-password"}
              />
            </div>
          </div>
        </div>
        
        {error && (
            <Alert variant="destructive">
                <AlertDescription className="text-xs flex items-center justify-center gap-2">
                   <AlertTriangle className="h-4 w-4"/>
                   <span>{error}</span>
                </AlertDescription>
            </Alert>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={handleSubmit} className="w-full">
            <LogIn className="mr-2 h-4 w-4" />
            {mode === 'login' ? 'Login' : 'Create Account'}
          </Button>
           <Button onClick={handleGuestLogin} className="w-full" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Use without synchronization
          </Button>
        </div>
        
        <Separator className="mt-4" />
        
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
