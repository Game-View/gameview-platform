import { Card, CardContent, CardDescription, CardHeader, CardTitle, RabbitLoader, toast } from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Plus, FolderOpen, Clock, Video, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useProjectFile, readProjectFile } from '../hooks/useTauri';

interface WelcomeScreenProps {
  onNewProduction: () => void;
}

export function WelcomeScreen({ onNewProduction }: WelcomeScreenProps) {
  const { settings, loadProject, addRecentProduction } = useAppStore();
  const { recentProductions } = settings;
  const [isLoading, setIsLoading] = useState(false);
  const { openProject, isLoading: isOpening } = useProjectFile();

  const handleOpenProduction = async () => {
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

  const handleOpenRecent = async (path: string, name: string) => {
    setIsLoading(true);
    try {
      const project = await readProjectFile(path);
      loadProject(project, path);
      addRecentProduction({
        id: name,
        name,
        path,
        lastOpened: new Date().toISOString(),
      });
      toast({
        title: 'Project Opened',
        description: `Loaded "${name}"`,
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: `Failed to open "${name}": ${err instanceof Error ? err.message : 'File not found'}`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isOpening) {
    return (
      <div className="flex h-full items-center justify-center">
        <RabbitLoader message="Loading project..." />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="mx-auto max-w-3xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gv-primary-500/10 border border-gv-primary-500/20">
            <Sparkles className="h-4 w-4 text-gv-primary-500" />
            <span className="text-sm text-gv-primary-400 font-medium">3D Reconstruction Platform</span>
          </div>
          <h1 className="text-4xl font-bold text-white">
            Welcome to Game View
          </h1>
          <p className="text-lg text-gv-neutral-400 max-w-xl mx-auto">
            Transform multi-camera footage into stunning 3D Gaussian Splats with real-time playback
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className="cursor-pointer bg-gv-neutral-800 border-gv-neutral-700 hover:border-gv-primary-500/50 hover:bg-gv-neutral-750 transition-all group"
            onClick={onNewProduction}
          >
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-gv bg-gv-primary-500/10 group-hover:bg-gv-primary-500/20 transition-colors">
                <Plus className="h-6 w-6 text-gv-primary-500" />
              </div>
              <CardTitle className="text-white text-lg">New Production</CardTitle>
              <CardDescription className="text-gv-neutral-400">
                Start a new 3D reconstruction project from your video footage
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer bg-gv-neutral-800 border-gv-neutral-700 hover:border-gv-neutral-600 hover:bg-gv-neutral-750 transition-all group"
            onClick={handleOpenProduction}
          >
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-gv bg-gv-neutral-700 group-hover:bg-gv-neutral-600 transition-colors">
                <FolderOpen className="h-6 w-6 text-gv-neutral-300" />
              </div>
              <CardTitle className="text-white text-lg">Open Production</CardTitle>
              <CardDescription className="text-gv-neutral-400">
                Continue working on an existing production file
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Productions */}
        {recentProductions.length > 0 && (
          <Card className="bg-gv-neutral-800 border-gv-neutral-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Clock className="h-4 w-4 text-gv-neutral-400" />
                Recent Productions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {recentProductions.map((production) => (
                  <li key={production.id}>
                    <button
                      className="w-full flex items-center gap-3 rounded-gv p-3 text-left transition-colors hover:bg-gv-neutral-700"
                      onClick={() => handleOpenRecent(production.path, production.name)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-gv bg-gv-neutral-700">
                        <Video className="h-5 w-5 text-gv-neutral-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{production.name}</div>
                        <div className="text-sm text-gv-neutral-500 truncate">{production.path}</div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Empty State for Recent */}
        {recentProductions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gv-neutral-500 text-sm">
              Your recent productions will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
