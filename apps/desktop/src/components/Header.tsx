import { Button, toast } from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Settings, Bell, ChevronDown, Search, Save, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { useProjectFile } from '../hooks/useTauri';

interface HeaderProps {
  onNewProduction: () => void;
}

export function Header({ onNewProduction }: HeaderProps) {
  const { currentProduction, projectPath, isProjectDirty, getProjectData, setProjectPath, setProjectDirty, loadProject, addRecentProduction } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const { saveProject, openProject, isSaving, isLoading } = useProjectFile();

  const handleSave = async () => {
    const projectData = getProjectData();
    if (!projectData) return;

    try {
      const path = await saveProject(projectData, projectPath);
      if (path) {
        setProjectPath(path);
        setProjectDirty(false);
        addRecentProduction({
          id: projectData.metadata.name,
          name: projectData.metadata.name,
          path,
          lastOpened: new Date().toISOString(),
        });
        toast({
          title: 'Project Saved',
          description: `Saved to ${path.split('/').pop()}`,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save project',
        variant: 'destructive',
      });
    }
  };

  const handleOpen = async () => {
    try {
      const result = await openProject();
      if (result) {
        loadProject(result.project, result.path);
        addRecentProduction({
          id: result.project.metadata.name,
          name: result.project.metadata.name,
          path: result.path,
          lastOpened: new Date().toISOString(),
        });
        toast({
          title: 'Project Opened',
          description: `Loaded "${result.project.metadata.name}"`,
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to open project',
        variant: 'destructive',
      });
    }
  };

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
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <span className="text-sm text-gv-neutral-400">
            {currentProduction.name}
          </span>
          {isProjectDirty && (
            <span className="text-xs text-gv-warning-500" title="Unsaved changes">*</span>
          )}
        </div>
      )}

      {/* Right: Actions + User */}
      <div className="flex items-center gap-4">
        {/* File actions */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleOpen} disabled={isLoading}>
            <FolderOpen className="w-4 h-4 mr-1" />
            Open
          </Button>
          {currentProduction && (
            <Button size="sm" variant="ghost" onClick={handleSave} disabled={isSaving || !isProjectDirty}>
              <Save className="w-4 h-4 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          <Button size="sm" onClick={onNewProduction}>
            New
            <ChevronDown className="ml-1 w-4 h-4" />
          </Button>
        </div>

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
