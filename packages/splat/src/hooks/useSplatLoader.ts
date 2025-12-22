import * as React from 'react';
import type { SplatMetadata } from '@gameview/types';

interface UseSplatLoaderResult {
  loading: boolean;
  error: Error | null;
  metadata: SplatMetadata | null;
  progress: number;
}

/**
 * Hook for loading Gaussian Splat PLY files
 */
export function useSplatLoader(url: string | null): UseSplatLoaderResult {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  const [metadata, setMetadata] = React.useState<SplatMetadata | null>(null);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    if (!url) {
      setMetadata(null);
      setProgress(0);
      return;
    }

    let cancelled = false;

    async function loadSplat() {
      setLoading(true);
      setError(null);
      setProgress(0);

      try {
        // TODO: Implement actual PLY parsing
        // This is a placeholder implementation
        if (!url) return;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to load: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const contentLength = +(response.headers.get('Content-Length') || 0);

        if (!reader) {
          throw new Error('Unable to read response body');
        }

        let receivedLength = 0;
        const chunks: Uint8Array[] = [];

        while (true) {
          const { done, value } = await reader.read();

          if (done || cancelled) break;

          chunks.push(value);
          receivedLength += value.length;

          if (contentLength > 0) {
            setProgress((receivedLength / contentLength) * 100);
          }
        }

        if (cancelled) return;

        // Parse PLY header to get metadata
        // This is a placeholder - actual implementation would parse the PLY format
        setMetadata({
          pointCount: 0,
          boundingBox: {
            min: [0, 0, 0],
            max: [1, 1, 1],
          },
          center: [0.5, 0.5, 0.5],
        });

        setProgress(100);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadSplat();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return { loading, error, metadata, progress };
}
