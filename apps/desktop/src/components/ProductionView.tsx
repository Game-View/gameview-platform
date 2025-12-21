import React from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  VideoDropZone,
  PresetSelector,
  ProcessingProgress,
} from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Play, Square, Trash2 } from 'lucide-react';

export function ProductionView() {
  const {
    currentProduction,
    isProcessing,
    processingProgress,
    addVideos,
    removeVideo,
    setProcessing,
    setProcessingProgress,
  } = useAppStore();

  if (!currentProduction) return null;

  const handleDrop = (files: File[]) => {
    // TODO: Convert File objects to VideoFile and add to production
    console.info('Dropped files:', files);
  };

  const handleBrowse = () => {
    // TODO: Use Tauri file dialog
    console.info('Browse for files');
  };

  const handlePresetChange = (preset: 'fast' | 'balanced' | 'high' | 'maximum') => {
    // TODO: Update production settings
    console.info('Preset changed:', preset);
  };

  const handleStartProcessing = async () => {
    setProcessing(true);
    setProcessingProgress({ stage: 'extracting_frames', progress: 0 });
    // TODO: Invoke Tauri command to start processing
    console.info('Start processing');
  };

  const handleCancelProcessing = () => {
    setProcessing(false);
    setProcessingProgress({ stage: 'idle', progress: 0 });
    // TODO: Invoke Tauri command to cancel processing
    console.info('Cancel processing');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{currentProduction.name}</h2>
          <p className="text-gv-neutral-500">
            {currentProduction.videos.length} video
            {currentProduction.videos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          {isProcessing ? (
            <Button variant="destructive" onClick={handleCancelProcessing}>
              <Square className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button
              onClick={handleStartProcessing}
              disabled={currentProduction.videos.length === 0}
            >
              <Play className="mr-2 h-4 w-4" />
              Process
            </Button>
          )}
        </div>
      </div>

      {isProcessing && <ProcessingProgress progress={processingProgress} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Videos</CardTitle>
            </CardHeader>
            <CardContent>
              {currentProduction.videos.length === 0 ? (
                <VideoDropZone
                  onDrop={handleDrop}
                  onBrowse={handleBrowse}
                  disabled={isProcessing}
                />
              ) : (
                <div className="space-y-4">
                  <ul className="space-y-2">
                    {currentProduction.videos.map((video) => (
                      <li
                        key={video.id}
                        className="flex items-center justify-between rounded-md border border-gv-neutral-200 p-3 dark:border-gv-neutral-700"
                      >
                        <div>
                          <div className="font-medium">{video.name}</div>
                          <div className="text-sm text-gv-neutral-500">
                            {video.duration ? `${Math.round(video.duration)}s` : 'Unknown duration'}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVideo(video.id)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <VideoDropZone
                    onDrop={handleDrop}
                    onBrowse={handleBrowse}
                    disabled={isProcessing}
                    className="min-h-[100px]"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Quality Preset
                </label>
                <PresetSelector
                  value={currentProduction.settings.preset}
                  onValueChange={handlePresetChange}
                  disabled={isProcessing}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
