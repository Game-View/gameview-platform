import React from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Plus, FolderOpen, Clock } from 'lucide-react';

export function WelcomeScreen() {
  const { settings } = useAppStore();
  const { recentProductions } = settings;

  const handleNewProduction = () => {
    // TODO: Implement new production creation
    console.info('Create new production');
  };

  const handleOpenProduction = () => {
    // TODO: Implement file picker for production
    console.info('Open production');
  };

  const handleOpenRecent = (path: string) => {
    // TODO: Implement opening recent production
    console.info('Open recent:', path);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gv-neutral-900 dark:text-gv-neutral-100">
          Welcome to Game View
        </h2>
        <p className="mt-2 text-gv-neutral-500">
          Create stunning 3D reconstructions from your multi-camera footage
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={handleNewProduction}
        >
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gv-primary-100 dark:bg-gv-primary-900">
              <Plus className="h-5 w-5 text-gv-primary-600" />
            </div>
            <CardTitle>New Production</CardTitle>
            <CardDescription>
              Start a new 3D reconstruction project
            </CardDescription>
          </CardHeader>
        </Card>

        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={handleOpenProduction}
        >
          <CardHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gv-accent-100 dark:bg-gv-accent-900">
              <FolderOpen className="h-5 w-5 text-gv-accent-600" />
            </div>
            <CardTitle>Open Production</CardTitle>
            <CardDescription>
              Open an existing production file
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {recentProductions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-4 w-4" />
              Recent Productions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recentProductions.map((production) => (
                <li key={production.id}>
                  <button
                    className="w-full rounded-md p-2 text-left transition-colors hover:bg-gv-neutral-100 dark:hover:bg-gv-neutral-800"
                    onClick={() => handleOpenRecent(production.path)}
                  >
                    <div className="font-medium">{production.name}</div>
                    <div className="text-sm text-gv-neutral-500">{production.path}</div>
                  </button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
