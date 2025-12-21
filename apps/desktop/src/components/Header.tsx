import React from 'react';
import { Button } from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Settings, FolderOpen, Plus } from 'lucide-react';

export function Header() {
  const { currentProduction, setCurrentProduction } = useAppStore();

  const handleNewProduction = () => {
    // TODO: Implement new production dialog
    console.info('New production');
  };

  const handleOpenProduction = () => {
    // TODO: Implement open production dialog
    console.info('Open production');
  };

  const handleSettings = () => {
    // TODO: Implement settings dialog
    console.info('Settings');
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gv-neutral-200 bg-white px-4 dark:border-gv-neutral-800 dark:bg-gv-neutral-900">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gv-primary-600">Game View</h1>
        {currentProduction && (
          <span className="text-sm text-gv-neutral-500">
            {currentProduction.name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleNewProduction}>
          <Plus className="mr-1 h-4 w-4" />
          New
        </Button>
        <Button variant="ghost" size="sm" onClick={handleOpenProduction}>
          <FolderOpen className="mr-1 h-4 w-4" />
          Open
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSettings}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
