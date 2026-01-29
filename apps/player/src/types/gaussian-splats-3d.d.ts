declare module "@mkkellogg/gaussian-splats-3d" {
  import * as THREE from "three";

  export enum WebXRMode {
    None = 0,
    VR = 1,
    AR = 2,
  }

  export enum RenderMode {
    Always = 0,
    OnChange = 1,
    Never = 2,
  }

  export enum SceneRevealMode {
    Default = 0,
    Gradual = 1,
    Instant = 2,
  }

  export enum LogLevel {
    None = 0,
    Error = 1,
    Warning = 2,
    Info = 3,
    Debug = 4,
  }

  export interface ViewerOptions {
    renderer?: THREE.WebGLRenderer;
    camera?: THREE.PerspectiveCamera;
    useBuiltInControls?: boolean;
    ignoreDevicePixelRatio?: boolean;
    gpuAcceleratedSort?: boolean;
    enableSIMDInSort?: boolean;
    sharedMemoryForWorkers?: boolean;
    integerBasedSort?: boolean;
    halfPrecisionCovariancesOnGPU?: boolean;
    dynamicScene?: boolean;
    webXRMode?: WebXRMode;
    renderMode?: RenderMode;
    sceneRevealMode?: SceneRevealMode;
    antialiased?: boolean;
    focalAdjustment?: number;
    logLevel?: LogLevel;
    sphericalHarmonicsDegree?: number;
    splatAlphaRemovalThreshold?: number;
    selfDrivenMode?: boolean;
  }

  export interface SplatSceneOptions {
    showLoadingUI?: boolean;
    progressiveLoad?: boolean;
    onProgress?: (percent: number) => void;
    position?: [number, number, number];
    rotation?: [number, number, number, string];
    scale?: [number, number, number];
    splatAlphaRemovalThreshold?: number;
  }

  export class Viewer {
    constructor(options?: ViewerOptions);
    addSplatScene(url: string, options?: SplatSceneOptions): Promise<void>;
    getSplatCount(): number;
    start(): void;
    stop(): void;
    dispose(): void;
    setRenderMode(mode: RenderMode): void;
    getCamera(): THREE.PerspectiveCamera;
    getRenderer(): THREE.WebGLRenderer;
  }
}
