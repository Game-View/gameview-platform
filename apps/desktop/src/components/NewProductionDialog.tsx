import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  FileUploadArea,
  toast,
} from '@gameview/ui';
import { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { pickVideos, pickOutputDirectory } from '../hooks/useTauri';
import { PRESET_SETTINGS } from '@gameview/types';
import type { Production, VideoFile } from '@gameview/types';

interface NewProductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewProductionDialog({ open, onOpenChange }: NewProductionDialogProps) {
  const { setCurrentProduction } = useAppStore();
  const [name, setName] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [productionType, setProductionType] = useState<'live' | 'record'>('record');
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleBrowseOutput = async () => {
    try {
      const dir = await pickOutputDirectory();
      if (dir) {
        setOutputDir(dir);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to open directory picker',
        variant: 'destructive',
      });
    }
  };

  const handleUploadVideos = async (files: FileList) => {
    const newVideos: VideoFile[] = Array.from(files).map((file, index) => ({
      id: `video-${Date.now()}-${index}`,
      path: (file as any).path || file.name, // Tauri provides path
      name: file.name,
    }));
    setVideos((prev) => [...prev, ...newVideos]);
  };

  const handleBrowseVideos = async () => {
    try {
      const paths = await pickVideos();
      if (paths.length > 0) {
        const newVideos: VideoFile[] = paths.map((path, index) => ({
          id: `video-${Date.now()}-${index}`,
          path,
          name: path.split(/[/\\]/).pop() || 'Unknown',
        }));
        setVideos((prev) => [...prev, ...newVideos]);
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to open file picker',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a production name',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const preset = 'balanced';
      const production: Production = {
        id: `prod-${Date.now()}`,
        name: name.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        videos,
        settings: {
          preset,
          totalSteps: PRESET_SETTINGS[preset].totalSteps ?? 15000,
          maxSplats: PRESET_SETTINGS[preset].maxSplats ?? 7500000,
          sizePercentage: PRESET_SETTINGS[preset].sizePercentage ?? 75,
          splatFps: PRESET_SETTINGS[preset].splatFps ?? 20,
          splatVideoLengthSeconds: PRESET_SETTINGS[preset].splatVideoLengthSeconds ?? 10,
          autoSync: true,
        },
        status: 'draft',
        outputPath: outputDir || undefined,
      };

      setCurrentProduction(production);
      onOpenChange(false);

      toast({
        title: 'Success!',
        description: `New production '${name}' created!`,
        variant: 'default',
      });

      // Reset form
      setName('');
      setOutputDir('');
      setVideos([]);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to create production',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-gv-neutral-800 border-gv-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">New production</DialogTitle>
          <DialogDescription className="text-gv-neutral-400">
            Set up a new 3D reconstruction project
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Production Name */}
          <div className="space-y-2">
            <Label className="text-gv-neutral-300">Production Name</Label>
            <Input
              placeholder="Please enter a production name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Production Type */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productionType"
                checked={productionType === 'live'}
                onChange={() => setProductionType('live')}
                className="w-4 h-4 text-gv-primary-500"
              />
              <span className="text-sm text-gv-neutral-300">Live production</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="productionType"
                checked={productionType === 'record'}
                onChange={() => setProductionType('record')}
                className="w-4 h-4 text-gv-primary-500"
              />
              <span className="text-sm text-gv-neutral-300">Record production</span>
            </label>
          </div>

          {/* Output Directory */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gv-neutral-300">Output Directory</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Select output folder"
                  value={outputDir.split(/[/\\]/).pop() || ''}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={handleBrowseOutput}>
                  Browse
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gv-neutral-300">Select scene</Label>
              <select className="w-full h-10 px-3 rounded-gv border border-gv-neutral-600 bg-gv-neutral-800 text-sm text-gv-neutral-300">
                <option>Select scene</option>
                <option>Scene 1</option>
                <option>Scene 2</option>
              </select>
            </div>
          </div>

          {/* Video Upload */}
          <Tabs defaultValue="uploads" className="w-full">
            <TabsList className="bg-gv-neutral-700">
              <TabsTrigger value="uploads">Uploads</TabsTrigger>
              <TabsTrigger value="library">Library</TabsTrigger>
            </TabsList>
            <TabsContent value="uploads" className="mt-4">
              <FileUploadArea
                onUpload={handleUploadVideos}
                accept="video/*"
                maxSize="5GB"
              />
              <div className="flex justify-center mt-2">
                <Button variant="ghost" size="sm" onClick={handleBrowseVideos}>
                  Or browse files
                </Button>
              </div>
              {videos.length > 0 && (
                <div className="mt-4 space-y-2">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="flex items-center justify-between p-3 bg-gv-neutral-700 rounded-gv"
                    >
                      <span className="text-sm text-gv-neutral-200">{video.name}</span>
                      <button
                        onClick={() => setVideos(videos.filter((v) => v.id !== video.id))}
                        className="text-gv-neutral-400 hover:text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
            <TabsContent value="library" className="mt-4">
              <div className="flex items-center justify-center h-32 text-gv-neutral-500 text-sm">
                Library coming soon...
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Splat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
