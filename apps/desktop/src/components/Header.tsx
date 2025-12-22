import { Button } from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Settings, Bell, ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  onNewProduction: () => void;
}

export function Header({ onNewProduction }: HeaderProps) {
  const { currentProduction } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="flex h-16 items-center justify-between border-b border-gv-neutral-800 bg-gv-neutral-900 px-6">
      {/* Left: Logo + Search */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐰</span>
          <span className="font-bold text-white tracking-wide">GAME VIEW</span>
        </div>

        {/* Search */}
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gv-neutral-500" />
          <input
            type="text"
            placeholder="Search an existing production"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-full text-sm text-gv-neutral-300 placeholder-gv-neutral-500 focus:outline-none focus:border-gv-primary-500"
          />
        </div>
      </div>

      {/* Center: Current production name */}
      {currentProduction && (
        <div className="absolute left-1/2 -translate-x-1/2">
          <span className="text-sm text-gv-neutral-400">
            {currentProduction.name}
          </span>
        </div>
      )}

      {/* Right: Actions + User */}
      <div className="flex items-center gap-4">
        {/* New button */}
        <Button size="sm" onClick={onNewProduction}>
          New
          <ChevronDown className="ml-1 w-4 h-4" />
        </Button>

        {/* Notifications */}
        <button className="p-2 text-gv-neutral-400 hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gv-neutral-700 flex items-center justify-center">
            <span className="text-sm text-white">JC</span>
          </div>
          <span className="text-sm text-white">James Curry</span>
          <ChevronDown className="w-4 h-4 text-gv-neutral-400" />
        </div>

        {/* Settings */}
        <button className="p-2 text-gv-neutral-400 hover:text-white transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
