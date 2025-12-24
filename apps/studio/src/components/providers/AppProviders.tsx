"use client";

import { CommandPalette, useCommandPalette } from "@/components/ui/CommandPalette";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const commandPalette = useCommandPalette();

  return (
    <>
      {children}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
      />
    </>
  );
}
