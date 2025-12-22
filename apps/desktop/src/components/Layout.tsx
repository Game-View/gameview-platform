import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Basic layout wrapper
 * Note: Main app layout is managed in App.tsx with AppSidebar
 */
export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
