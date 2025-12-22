import {
  Button,
  FileUploadArea,
  FileGrid,
  PresetSelector,
  RabbitLoader,
  toast,
} from '@gameview/ui';
import type { FileItem } from '@gameview/ui';
import { useAppStore } from '../store/appStore';
import { Play, Square, Settings2, ChevronRight } from 'lucide-react';
import { useProcessing, pickVideos } from '../hooks/useTauri';
import { useState } from 'react';

export function ProductionView() {
  const {
    currentProduction,
    addVideos,
    removeVideo,
    updateProductionSettings,
  } = useAppStore();

  const { isProcessing, progress, startProcessing, cancelProcessing } = useProcessing();
  const [showSettings, setShowSettings] = useState(true);

  if (!currentProduction) return null;

  const handleUploadVideos = async (files: FileList) => {
    const newVideos = Array.from(files).map((file, index) => ({
      id: `video-${Date.now()}-${index}`,
      path: (file as any).path || file.name,
      name: file.name,
    }));
    addVideos(newVideos);
  };

  const handleBrowseVideos = async () => {
    try {
      const paths = await pickVideos();
      if (paths.length > 0) {
        const newVideos = paths.map((path, index) => ({
          id: `video-${Date.now()}-${index}`,
          path,
          name: path.split(/[/\\]/).pop() || 'Unknown',
        }));
        addVideos(newVideos);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to open file picker',
        variant: 'destructive',
      });
    }
  };

  const handlePresetChange = (preset: 'fast' | 'balanced' | 'high' | 'maximum') => {
    updateProductionSettings({ preset });
  };

  const handleStartProcessing = async () => {
    if (currentProduction.videos.length === 0) {
      toast({
        title: 'No videos',
        description: 'Please add at least one video to process',
        variant: 'destructive',
      });
      return;
    }

    try {
      await startProcessing({
        videos: currentProduction.videos.map(v => v.path),
        outputDir: currentProduction.outputPath || './output',
        preset: currentProduction.settings.preset,
      });
    } catch (err) {
      toast({
        title: 'Processing failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCancelProcessing = () => {
    cancelProcessing();
    toast({
      title: 'Cancelled',
      description: 'Processing has been cancelled',
    });
  };

  // Convert videos to FileItem format for FileGrid
  const fileItems: FileItem[] = currentProduction.videos.map((video) => ({
    id: video.id,
    name: video.name,
    type: 'video' as const,
    thumbnail: video.thumbnailPath,
  }));

  // Processing view
  if (isProcessing && progress) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <RabbitLoader
            message={getProgressMessage(progress.stage)}
            progress={progress.progress}
            size="lg"
          />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gv-neutral-400">Stage</span>
              <span className="text-white capitalize">{progress.stage.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gv-neutral-400">Progress</span>
              <span className="text-white">{Math.round(progress.progress)}%</span>
            </div>
            {progress.message && (
              <div className="flex justify-between text-sm">
                <span className="text-gv-neutral-400">Status</span>
                <span className="text-white">{progress.message}</span>
              </div>
            )}
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleCancelProcessing}
          >
            <Square className="mr-2 h-4 w-4" />
            Cancel Processing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gv-neutral-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white">{currentProduction.name}</h2>
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gv-neutral-700 text-gv-neutral-300">
            {currentProduction.videos.length} video{currentProduction.videos.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            className="text-gv-neutral-400 hover:text-white"
          >
            <Settings2 className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleStartProcessing}
            disabled={currentProduction.videos.length === 0}
          >
            <Play className="mr-2 h-4 w-4" />
            Splat
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-6 overflow-auto">
          {currentProduction.videos.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-full max-w-md">
                <FileUploadArea
                  onUpload={handleUploadVideos}
                  accept="video/*"
                  maxSize="5GB"
                />
                <p className="text-center text-sm text-gv-neutral-500 mt-4">
                  Or <button onClick={handleBrowseVideos} className="text-gv-primary-500 hover:underline">browse files</button>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <FileGrid
                files={fileItems}
                onRemove={(id) => removeVideo(id)}
              />
              <FileUploadArea
                onUpload={handleUploadVideos}
                accept="video/*"
                maxSize="5GB"
              />
            </div>
          )}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="w-80 border-l border-gv-neutral-800 p-6 overflow-auto">
            <div className="space-y-6">
              {/* Quality Preset */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gv-neutral-300">
                  Quality Preset
                </label>
                <PresetSelector
                  value={currentProduction.settings.preset}
                  onValueChange={handlePresetChange}
                />
              </div>

              {/* Output Settings */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gv-neutral-300">
                  Output
                </label>
                <div className="p-3 rounded-gv bg-gv-neutral-800 border border-gv-neutral-700">
                  <div className="text-sm text-white truncate">
                    {currentProduction.outputPath || 'Default output directory'}
                  </div>
                </div>
              </div>

              {/* Auto Sync */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gv-neutral-300">
                  Auto-sync cameras
                </label>
                <button
                  onClick={() => updateProductionSettings({ autoSync: !currentProduction.settings.autoSync })}
                  className={`
                    relative w-11 h-6 rounded-full transition-colors
                    ${currentProduction.settings.autoSync ? 'bg-gv-primary-500' : 'bg-gv-neutral-700'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                      ${currentProduction.settings.autoSync ? 'left-6' : 'left-1'}
                    `}
                  />
                </button>
              </div>

              {/* Processing Info */}
              <div className="pt-4 border-t border-gv-neutral-800">
                <h4 className="text-sm font-medium text-gv-neutral-300 mb-3">Processing Steps</h4>
                <ol className="space-y-2 text-sm text-gv-neutral-400">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Extract frames from videos
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Detect camera positions
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Generate point cloud
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Train Gaussian Splats
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3" />
                    Export for playback
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getProgressMessage(stage: string): string {
  const messages: Record<string, string> = {
    idle: 'Ready to process',
    extracting_frames: 'Extracting frames from videos...',
    detecting_cameras: 'Detecting camera positions...',
    generating_pointcloud: 'Generating point cloud...',
    training_splats: 'Training Gaussian Splats...',
    exporting: 'Exporting final result...',
    complete: 'Processing complete!',
  };
  return messages[stage] || 'Processing...';
}
