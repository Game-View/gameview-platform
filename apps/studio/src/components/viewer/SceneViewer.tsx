"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as GaussianSplats3D from "@mkkellogg/gaussian-splats-3d";
import * as THREE from "three";

export interface SceneViewerProps {
  splatUrl: string;
  thumbnailUrl?: string;
  initialPosition?: { x: number; y: number; z: number };
  initialTarget?: { x: number; y: number; z: number };
  enableFirstPersonControls?: boolean;
  movementSpeed?: number;
  lookSensitivity?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export function SceneViewer({
  splatUrl,
  thumbnailUrl,
  initialPosition = { x: 0, y: 2, z: 5 },
  initialTarget = { x: 0, y: 0, z: 0 },
  enableFirstPersonControls = true,
  movementSpeed = 5,
  lookSensitivity = 0.002,
  onLoad,
  onError,
  onProgress,
}: SceneViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  // First-person controls state
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    up: false,
    down: false,
    jump: false,
    lookUp: false,
    lookDown: false,
    lookLeft: false,
    lookRight: false,
    spin: false,
  });
  const rotationRef = useRef({ pitch: 0, yaw: 0 });
  const velocityRef = useRef({ y: 0 });
  const isGroundedRef = useRef(true);
  const groundLevelRef = useRef(initialPosition.y);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const initializingRef = useRef(false);
  const initializedUrlRef = useRef<string | null>(null);

  // Use refs for callbacks to avoid re-triggering effect
  const onLoadRef = useRef(onLoad);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onLoadRef.current = onLoad;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onLoad, onError, onProgress]);

  // Request pointer lock for mouse look
  const requestPointerLock = useCallback(() => {
    if (!enableFirstPersonControls) return;
    const canvas = containerRef.current?.querySelector('canvas');
    if (canvas) {
      canvas.requestPointerLock();
    }
  }, [enableFirstPersonControls]);

  // Handle pointer lock change
  useEffect(() => {
    if (!enableFirstPersonControls) return;

    const handleLockChange = () => {
      const canvas = containerRef.current?.querySelector('canvas');
      setIsPointerLocked(document.pointerLockElement === canvas);
    };

    document.addEventListener("pointerlockchange", handleLockChange);
    return () => document.removeEventListener("pointerlockchange", handleLockChange);
  }, [enableFirstPersonControls]);

  // Handle mouse movement for looking
  useEffect(() => {
    if (!enableFirstPersonControls) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPointerLocked) return;

      const { movementX, movementY } = e;

      // Update rotation
      rotationRef.current.yaw -= movementX * lookSensitivity * 50;
      rotationRef.current.pitch -= movementY * lookSensitivity * 50;

      // Clamp pitch
      rotationRef.current.pitch = Math.max(-89, Math.min(89, rotationRef.current.pitch));

      // Normalize yaw
      rotationRef.current.yaw = rotationRef.current.yaw % 360;
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [enableFirstPersonControls, isPointerLocked, lookSensitivity]);

  // Handle keyboard input
  useEffect(() => {
    if (!enableFirstPersonControls) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": keysRef.current.forward = true; break;
        case "KeyS": keysRef.current.backward = true; break;
        case "KeyA": keysRef.current.left = true; break;
        case "KeyD": keysRef.current.right = true; break;
        case "ShiftLeft":
        case "ShiftRight": keysRef.current.sprint = true; break;
        case "ArrowUp": keysRef.current.lookUp = true; break;
        case "ArrowDown": keysRef.current.lookDown = true; break;
        case "ArrowLeft": keysRef.current.lookLeft = true; break;
        case "ArrowRight": keysRef.current.lookRight = true; break;
        case "KeyT": keysRef.current.up = true; break;
        case "KeyG": keysRef.current.down = true; break;
        case "Space":
          if (isGroundedRef.current) {
            keysRef.current.jump = true;
            velocityRef.current.y = 8; // Jump force
            isGroundedRef.current = false;
          }
          break;
        case "KeyQ": keysRef.current.spin = true; break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW": keysRef.current.forward = false; break;
        case "KeyS": keysRef.current.backward = false; break;
        case "KeyA": keysRef.current.left = false; break;
        case "KeyD": keysRef.current.right = false; break;
        case "ShiftLeft":
        case "ShiftRight": keysRef.current.sprint = false; break;
        case "ArrowUp": keysRef.current.lookUp = false; break;
        case "ArrowDown": keysRef.current.lookDown = false; break;
        case "ArrowLeft": keysRef.current.lookLeft = false; break;
        case "ArrowRight": keysRef.current.lookRight = false; break;
        case "KeyT": keysRef.current.up = false; break;
        case "KeyG": keysRef.current.down = false; break;
        case "Space": keysRef.current.jump = false; break;
        case "KeyQ": keysRef.current.spin = false; break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enableFirstPersonControls]);

  // Click to enter pointer lock
  useEffect(() => {
    if (!enableFirstPersonControls) return;

    const container = containerRef.current;
    if (!container) return;

    const handleClick = () => {
      if (!isPointerLocked) {
        requestPointerLock();
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [enableFirstPersonControls, isPointerLocked, requestPointerLock]);

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current || !splatUrl) return;

    // Skip if already initialized for this URL or currently initializing
    if (viewerRef.current || initializingRef.current || initializedUrlRef.current === splatUrl) {
      return;
    }

    // Mark as initializing
    initializingRef.current = true;

    const container = containerRef.current;
    let isMounted = true;
    const instanceId = Math.random().toString(36).substr(2, 9);

    // Delay to handle React Strict Mode's double-mount cycle
    const initTimeout = setTimeout(() => {
      // Double-check all conditions after delay
      if (!isMounted || viewerRef.current || !initializingRef.current) {
        initializingRef.current = false;
        return;
      }

      // Use current prop values at initialization time
      const initPos = initialPosition;
      const initTarget = initialTarget;
      const useFpsControls = enableFirstPersonControls;

      // Let the viewer create its own renderer, camera, and controls
      // This is the simplest initialization pattern from the library docs
      // Note: TypeScript types are incomplete, so we use type assertion
      const viewerOptions = {
        cameraUp: [0, 1, 0], // Standard Y-up
        initialCameraPosition: [initPos.x, initPos.y, initPos.z],
        initialCameraLookAt: [initTarget.x, initTarget.y, initTarget.z],
        sharedMemoryForWorkers: false,
        renderMode: GaussianSplats3D.RenderMode.Always,
        sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
        logLevel: GaussianSplats3D.LogLevel.None,
        sphericalHarmonicsDegree: 0,
        // Disable built-in orbit controls when using first-person controls
        useBuiltInControls: !useFpsControls,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewer = new GaussianSplats3D.Viewer(viewerOptions as any);
      // Cast to any for accessing internal properties not exposed in types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewerInternal = viewer as any;

      // Calculate initial yaw from lookAt target
      const dx = initTarget.x - initPos.x;
      const dz = initTarget.z - initPos.z;
      rotationRef.current.yaw = Math.atan2(dx, dz) * (180 / Math.PI);

      viewerRef.current = viewer;
      initializedUrlRef.current = splatUrl;
      initializingRef.current = false;

      console.log('[SceneViewer] Viewer created, checking renderer...');
      console.log('[SceneViewer] Renderer:', viewerInternal.renderer);
      console.log('[SceneViewer] Camera:', viewerInternal.camera);

      // Move the viewer's canvas into our container
      // The viewer creates and appends its canvas to document.body by default
      setTimeout(() => {
        // Find the canvas created by the viewer (should be in body)
        const viewerCanvas = viewerInternal.renderer?.domElement;
        console.log('[SceneViewer] Canvas element:', viewerCanvas);
        console.log('[SceneViewer] Canvas parent:', viewerCanvas?.parentElement);
        console.log('[SceneViewer] Container:', container);
        console.log('[SceneViewer] Container dimensions:', container.clientWidth, 'x', container.clientHeight);

        if (viewerCanvas && viewerCanvas.parentElement !== container) {
          // Style the canvas to fill our container
          viewerCanvas.style.width = '100%';
          viewerCanvas.style.height = '100%';
          viewerCanvas.style.position = 'absolute';
          viewerCanvas.style.top = '0';
          viewerCanvas.style.left = '0';
          container.appendChild(viewerCanvas);
          console.log('[SceneViewer] Canvas moved to container');

          // Resize to match container
          const width = container.clientWidth;
          const height = container.clientHeight;
          viewerInternal.renderer?.setSize(width, height);
          if (viewerInternal.camera) {
            const cam = viewerInternal.camera;
            if (cam.aspect !== undefined) {
              cam.aspect = width / height;
              cam.updateProjectionMatrix();
            }
          }
          console.log('[SceneViewer] Renderer resized to:', width, 'x', height);
        } else if (!viewerCanvas) {
          console.error('[SceneViewer] No canvas found on renderer!');
        } else {
          console.log('[SceneViewer] Canvas already in container');
        }
      }, 50);

      // Load the splat file
      console.log('[SceneViewer] Starting to load splat from:', splatUrl);
      viewer
        .addSplatScene(splatUrl, {
          showLoadingUI: false,
          progressiveLoad: true,
          onProgress: (percent: number) => {
            if (!isMounted) return;
            setLoadProgress(Math.round(percent));
            onProgressRef.current?.(percent);
          },
        })
        .then(() => {
          if (!isMounted) {
            return;
          }
          console.log('[SceneViewer] Splat loaded successfully');
          console.log('[SceneViewer] Splat count:', viewerInternal.splatMesh?.getSplatCount?.() || 'unknown');
          console.log('[SceneViewer] Camera position:', viewerInternal.camera?.position);
          setIsLoading(false);
          onLoadRef.current?.();
          viewer.start();
          console.log('[SceneViewer] Viewer started');
        })
        .catch((err: Error) => {
          if (!isMounted) return;
          console.error(`[SceneViewer] Failed to load:`, err);
          setError(err.message || "Failed to load 3D scene");
          setIsLoading(false);
          onErrorRef.current?.(err);
        });

      // Handle resize
      const handleResize = () => {
        if (!container || !isMounted || !viewerInternal.renderer || !viewerInternal.camera) return;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const cam = viewerInternal.camera;
        if (cam.aspect !== undefined) {
          cam.aspect = width / height;
          cam.updateProjectionMatrix();
        }
        viewerInternal.renderer.setSize(width, height);
      };

      window.addEventListener("resize", handleResize);

      // Store cleanup for resize listener
      (window as unknown as Record<string, () => void>)[`sceneViewerResize_${instanceId}`] = () => {
        window.removeEventListener("resize", handleResize);
      };
    }, 100); // 100ms delay for Strict Mode

    // Cleanup
    return () => {
      isMounted = false;
      clearTimeout(initTimeout);
      initializingRef.current = false;

      // Remove resize listener if it was set
      const cleanupResize = (window as unknown as Record<string, () => void>)[`sceneViewerResize_${instanceId}`];
      if (cleanupResize) {
        cleanupResize();
        delete (window as unknown as Record<string, () => void>)[`sceneViewerResize_${instanceId}`];
      }

      if (viewerRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const viewerInternal = viewerRef.current as any;

        // Stop and dispose first
        try {
          viewerRef.current.stop();
        } catch {
          // Ignore stop errors
        }

        // Safely remove canvas - check parent before removing
        try {
          const canvas = viewerInternal.renderer?.domElement;
          if (canvas && canvas.parentElement) {
            canvas.parentElement.removeChild(canvas);
          }
        } catch {
          // Ignore canvas removal errors
        }

        // Dispose the viewer to release WebGL context
        try {
          viewerRef.current.dispose();
        } catch {
          // Ignore dispose errors
        }

        viewerRef.current = null;
        initializedUrlRef.current = null;
      }
    };
  }, [splatUrl]); // Only re-run when URL changes - other props read at init time

  // First-person controls animation loop
  useEffect(() => {
    if (!enableFirstPersonControls || isLoading) return;

    const keyboardLookSpeed = 90; // degrees per second
    const spinSpeed = 180; // degrees per second
    const verticalSpeed = 4;
    const gravity = 20;

    const animate = (currentTime: number) => {
      if (!viewerRef.current) return;

      // Calculate delta time
      const delta = lastTimeRef.current ? (currentTime - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = currentTime;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewerInternal = viewerRef.current as any;
      const camera = viewerInternal.camera;
      if (!camera) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const keys = keysRef.current;
      const speed = keys.sprint ? movementSpeed * 1.5 : movementSpeed;

      // ===== KEYBOARD LOOK =====
      if (keys.lookUp) {
        rotationRef.current.pitch = Math.min(89, rotationRef.current.pitch + keyboardLookSpeed * delta);
      }
      if (keys.lookDown) {
        rotationRef.current.pitch = Math.max(-89, rotationRef.current.pitch - keyboardLookSpeed * delta);
      }
      if (keys.lookLeft) {
        rotationRef.current.yaw += keyboardLookSpeed * delta;
      }
      if (keys.lookRight) {
        rotationRef.current.yaw -= keyboardLookSpeed * delta;
      }
      if (keys.spin) {
        rotationRef.current.yaw += spinSpeed * delta;
      }

      // Normalize yaw
      rotationRef.current.yaw = rotationRef.current.yaw % 360;

      // ===== HORIZONTAL MOVEMENT =====
      let forward = 0;
      let strafe = 0;

      if (keys.forward) forward += 1;
      if (keys.backward) forward -= 1;
      if (keys.left) strafe -= 1;
      if (keys.right) strafe += 1;

      let moveX = 0;
      let moveZ = 0;

      if (forward !== 0 || strafe !== 0) {
        // Normalize diagonal movement
        const length = Math.sqrt(forward * forward + strafe * strafe);
        forward /= length;
        strafe /= length;

        // Get yaw in radians
        const yawRad = (rotationRef.current.yaw * Math.PI) / 180;

        // Calculate world-space movement
        moveX = Math.sin(yawRad) * forward + Math.cos(yawRad) * strafe;
        moveZ = Math.cos(yawRad) * forward - Math.sin(yawRad) * strafe;
      }

      // ===== VERTICAL MOVEMENT =====
      let verticalMove = 0;
      if (keys.up) verticalMove += verticalSpeed * delta;
      if (keys.down) verticalMove -= verticalSpeed * delta;

      // Apply gravity if not using T/G vertical controls
      if (!keys.up && !keys.down) {
        velocityRef.current.y -= gravity * delta;
      } else {
        velocityRef.current.y = 0;
      }

      // Calculate new position
      const newPos = {
        x: camera.position.x + moveX * speed * delta,
        y: camera.position.y + velocityRef.current.y * delta + verticalMove,
        z: camera.position.z + moveZ * speed * delta,
      };

      // Ground collision
      if (newPos.y <= groundLevelRef.current && !keys.up && !keys.down) {
        newPos.y = groundLevelRef.current;
        velocityRef.current.y = 0;
        isGroundedRef.current = true;
      } else if (keys.up || keys.down) {
        groundLevelRef.current = newPos.y;
        isGroundedRef.current = true;
      }

      // Update camera position
      camera.position.set(newPos.x, newPos.y, newPos.z);

      // ===== APPLY ROTATION =====
      const pitchRad = (rotationRef.current.pitch * Math.PI) / 180;
      const yawRad = (rotationRef.current.yaw * Math.PI) / 180;

      // Create rotation using Euler angles (yaw first, then pitch)
      const euler = new THREE.Euler(pitchRad, yawRad, 0, "YXZ");
      camera.quaternion.setFromEuler(euler);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [enableFirstPersonControls, isLoading, movementSpeed]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-black">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gv-neutral-900/90 z-10">
          {thumbnailUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}
          <div className="relative z-10 text-center">
            <div className="w-16 h-16 border-4 border-gv-primary-500/30 border-t-gv-primary-500 rounded-full animate-spin mb-4 mx-auto" />
            <p className="text-white font-medium mb-2">Loading 3D Scene</p>
            <p className="text-gv-neutral-400 text-sm">{loadProgress}%</p>
            <div className="w-48 h-1.5 bg-gv-neutral-700 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gv-primary-500 transition-all duration-300"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gv-neutral-900/90 z-10">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-white font-medium mb-2">Failed to Load Scene</p>
            <p className="text-gv-neutral-400 text-sm max-w-xs">{error}</p>
          </div>
        </div>
      )}

      {/* Controls hint for first-person mode */}
      {enableFirstPersonControls && !isLoading && !error && !isPointerLocked && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/70 backdrop-blur-sm px-4 py-2 rounded-gv text-center">
            <p className="text-white text-sm font-medium mb-1">Click to enable mouse look</p>
            <p className="text-gv-neutral-400 text-xs">
              WASD: Move | Mouse: Look | Space: Jump | T/G: Up/Down | Shift: Sprint
            </p>
          </div>
        </div>
      )}

      {/* Pointer locked indicator */}
      {enableFirstPersonControls && !isLoading && !error && isPointerLocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-black/50 backdrop-blur-sm px-3 py-1 rounded-gv">
            <p className="text-gv-neutral-300 text-xs">Press ESC to release mouse</p>
          </div>
        </div>
      )}
    </div>
  );
}
