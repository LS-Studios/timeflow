
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogScrollableContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, AtSign, KeyRound, User, HardDrive, AlertTriangle, Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/logo";
import { useTranslation } from "@/lib/i18n";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrength } from "@/components/password-strength";
import { useToast } from "@/hooks/use-toast";

export function LoginDialog() {
  const { t } = useTranslation();
  const { login, register, loginAsGuest } = useAuth();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const resetForm = () => {
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (mode === 'login') {
      if (!email || !password) {
        setError(t('errorFillAllFields'));
        setIsLoading(false);
        return;
      }
      const result = await login(email, password);
      if (result && !result.success) {
        setError(result.message);
      }
      // On success, the onAuthStateChanged listener will handle closing the dialog.
    } else { // register
      if (!name || !email || !password || !confirmPassword) {
        setError(t('errorFillAllFields'));
        setIsLoading(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setError(t('errorPasswordsDoNotMatch'));
        setIsLoading(false);
        return;
      }
      
      const result = await register(name, email, password);
      if (result.success) {
          toast({
              title: t('accountCreatedSuccessTitle'),
              description: t('accountCreatedSuccessDescription'),
          });
          setMode('login');
          resetForm();
      } else {
          setError(result.message);
      }
    }

    setIsLoading(false);
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
        <DialogScrollableContent>
          <div className="flex flex-col items-center text-center mb-6">
            <Logo />
            <h2 className="text-2xl font-semibold pt-4 mb-2">
              {mode === 'login' ? t('welcomeBack') : t('createAccount')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? t('loginDescription') : t('registerDescription')}
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 mb-4">
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t('name')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder={t('namePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      autoComplete="name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
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
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <div className="relative">
                   <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    autoComplete={mode === 'login' ? "current-password" : "new-password"}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              {mode === 'register' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-9 pr-9"
                      autoComplete="new-password"
                      disabled={isLoading}
                      onPaste={(e) => e.preventDefault()}
                      onDrop={(e) => e.preventDefault()}
                      onDragOver={(e) => e.preventDefault()}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword && password && password !== confirmPassword && (
                    <p className="text-xs text-destructive">{t('passwordsDoNotMatch')}</p>
                  )}
                </div>
              )}
              {mode === 'register' && <PasswordStrength password={password} />}
            </div>
            
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription className="flex items-center justify-center gap-2">
                       <AlertTriangle className="h-4 w-4"/>
                       <span className="text-xs">{t(error)}</span>
                    </AlertDescription>
                </Alert>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : <LogIn />}
                {mode === 'login' ? t('login') : t('createAccount')}
              </Button>
            </div>
          </form>
          
          <div className="flex flex-col gap-2 mt-4">
             <Button onClick={handleGuestLogin} className="w-full" variant="outline" disabled={isLoading}>
              <HardDrive className="mr-2 h-4 w-4" />
              {t('useWithoutSync')}
            </Button>
          </div>
          
          <Separator className="my-4" />
          
          <div className="text-center text-sm">
              {mode === 'login' ? t('noAccount') : t('hasAccount')}
              <Button variant="link" className="pl-1.5" onClick={toggleMode} disabled={isLoading}>
                  {mode === 'login' ? t('signUp') : t('login')}
              </Button>
          </div>
        </DialogScrollableContent>

      </DialogContent>
    </Dialog>
  );
}
