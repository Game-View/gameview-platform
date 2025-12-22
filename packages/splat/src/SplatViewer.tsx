import * as React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import type { SplatViewerOptions } from '@gameview/types';

export interface SplatViewerProps {
  plyUrl?: string;
  options?: SplatViewerOptions;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * 3D Gaussian Splat Viewer component
 *
 * Renders Gaussian Splat point clouds from PLY files
 */
export function SplatViewer({
  plyUrl,
  options = { quality: 'medium' },
  className,
  onLoad,
  onError,
}: SplatViewerProps) {
  const { backgroundColor = '#1a1a2e', showGrid = true, initialCamera } = options;

  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: 400 }}>
      <Canvas
        camera={{
          position: initialCamera?.position || [0, 2, 5],
          fov: 60,
        }}
        style={{ background: backgroundColor }}
        onCreated={() => onLoad?.()}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />

        {showGrid && (
          <Grid
            args={[20, 20]}
            cellSize={1}
            cellColor="#6b7280"
            sectionSize={5}
            sectionColor="#374151"
            fadeDistance={30}
            fadeStrength={1}
            infiniteGrid
          />
        )}

        <OrbitControls
          enablePan
          enableZoom
          enableRotate
          minDistance={1}
          maxDistance={100}
          target={initialCamera?.target || [0, 0, 0]}
        />

        {plyUrl && (
          <SplatPointCloud
            url={plyUrl}
            quality={options.quality}
            onError={onError}
          />
        )}

        <Environment preset="studio" />
      </Canvas>
    </div>
  );
}

interface SplatPointCloudProps {
  url: string;
  quality: 'low' | 'medium' | 'high';
  onError?: (error: Error) => void;
}

function SplatPointCloud({ url, quality, onError }: SplatPointCloudProps) {
  // Placeholder for actual Gaussian Splat rendering
  // In production, this would use a proper 3DGS renderer like gsplat.js

  React.useEffect(() => {
    // TODO: Implement PLY loading and Gaussian Splat rendering
    // This would parse the PLY file and render the splats
    console.info('Loading splat from:', url, 'with quality:', quality);

    // onError is available for error handling when loading fails
    if (false) onError?.(new Error('placeholder'));
  }, [url, quality, onError]);

  return (
    <mesh>
      <sphereGeometry args={[0.1, 32, 32]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
}
