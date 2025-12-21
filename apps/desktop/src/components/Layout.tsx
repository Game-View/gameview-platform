import React from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
