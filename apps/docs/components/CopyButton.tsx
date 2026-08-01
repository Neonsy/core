'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CopyButton({
  code,
  className,
}: {
  code: string;
  className?: string;
}): React.ReactElement {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('h-8 w-8 text-muted-foreground hover:text-foreground', className)}
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          /* ignore */
        }
      }}>
      {copied ? <Check className="!size-3.5 text-emerald-500" /> : <Copy className="!size-3.5" />}
    </Button>
  );
}
