
"use client";

import { useMemo } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password?: string;
}

type Requirement = {
  id: 'length' | 'uppercase' | 'lowercase' | 'number' | 'special';
  regex: RegExp;
  labelKey: string;
};

const requirements: Requirement[] = [
  { id: 'length', regex: /.{8,}/, labelKey: 'passwordRequirementLength' },
  { id: 'uppercase', regex: /[A-Z]/, labelKey: 'passwordRequirementUppercase' },
  { id: 'lowercase', regex: /[a-z]/, labelKey: 'passwordRequirementLowercase' },
  { id: 'number', regex: /[0-9]/, labelKey: 'passwordRequirementNumber' },
  { id: 'special', regex: /[^A-Za-z0-9]/, labelKey: 'passwordRequirementSpecial' },
];

export function PasswordStrength({ password = '' }: PasswordStrengthProps) {
  const { t } = useTranslation();

  const fulfilledRequirements = useMemo(() => {
    return requirements.map(req => ({
      ...req,
      isFulfilled: req.regex.test(password),
    }));
  }, [password]);
  
  if (!password) {
      return null;
  }

  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-1.5">
      {fulfilledRequirements.map(req => (
        <div key={req.id} className="flex items-center gap-2 text-xs">
          {req.isFulfilled ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className={cn(req.isFulfilled ? 'text-foreground' : 'text-muted-foreground')}>
            {t(req.labelKey)}
          </span>
        </div>
      ))}
    </div>
  );
}
