"use client";

import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlaytestStore } from "@/stores/playtest-store";

interface FirstPersonControlsProps {
  enabled?: boolean;
  movementSpeed?: number;
  lookSensitivity?: number;
  minPitch?: number;
  maxPitch?: number;
}

export function FirstPersonControls({
  enabled = true,
  movementSpeed = 5,
  lookSensitivity = 0.002,
  minPitch = -89,
  maxPitch = 89,
}: FirstPersonControlsProps) {
  const { camera, gl } = useThree();
  const { isPlaytestMode, isPaused, updatePlayerPosition, updatePlayerRotation, playerState } =
    usePlaytestStore();

  // Movement state
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  // Look state
  const rotationRef = useRef({ pitch: 0, yaw: 0 });
  const isLockedRef = useRef(false);

  // Request pointer lock
  const requestPointerLock = useCallback(() => {
    if (!enabled || !isPlaytestMode) return;
    gl.domElement.requestPointerLock();
  }, [enabled, isPlaytestMode, gl.domElement]);

  // Handle pointer lock change
  useEffect(() => {
    const handleLockChange = () => {
      isLockedRef.current = document.pointerLockElement === gl.domElement;
    };

    const handleLockError = () => {
      console.error("Pointer lock error");
      isLockedRef.current = false;
    };

    document.addEventListener("pointerlockchange", handleLockChange);
    document.addEventListener("pointerlockerror", handleLockError);

    return () => {
      document.removeEventListener("pointerlockchange", handleLockChange);
      document.removeEventListener("pointerlockerror", handleLockError);
    };
  }, [gl.domElement]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current || !enabled || isPaused) return;

      const { movementX, movementY } = e;

      // Update rotation
      rotationRef.current.yaw -= movementX * lookSensitivity * 50;
      rotationRef.current.pitch -= movementY * lookSensitivity * 50;

      // Clamp pitch
      rotationRef.current.pitch = Math.max(
        minPitch,
        Math.min(maxPitch, rotationRef.current.pitch)
      );

      // Normalize yaw
      rotationRef.current.yaw = rotationRef.current.yaw % 360;

      updatePlayerRotation(rotationRef.current);
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [enabled, isPaused, lookSensitivity, minPitch, maxPitch, updatePlayerRotation]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabled || isPaused) return;

      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keysRef.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keysRef.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keysRef.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keysRef.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, isPaused]);

  // Click to enter pointer lock
  useEffect(() => {
    const handleClick = () => {
      if (enabled && isPlaytestMode && !isLockedRef.current) {
        requestPointerLock();
      }
    };

    gl.domElement.addEventListener("click", handleClick);
    return () => gl.domElement.removeEventListener("click", handleClick);
  }, [enabled, isPlaytestMode, requestPointerLock, gl.domElement]);

  // Sync camera on playtest start
  useEffect(() => {
    if (isPlaytestMode && enabled) {
      // Set initial camera position
      camera.position.set(
        playerState.position.x,
        playerState.position.y,
        playerState.position.z
      );
      rotationRef.current = { ...playerState.rotation };
    }
  }, [isPlaytestMode, enabled, camera, playerState.position, playerState.rotation]);

  // Frame update
  useFrame((_, delta) => {
    if (!enabled || !isPlaytestMode || isPaused) return;

    const keys = keysRef.current;
    const speed = keys.sprint ? movementSpeed * 1.5 : movementSpeed;

    // Calculate movement direction
    let forward = 0;
    let strafe = 0;

    if (keys.forward) forward += 1;
    if (keys.backward) forward -= 1;
    if (keys.left) strafe -= 1;
    if (keys.right) strafe += 1;

    // Apply movement if any keys are pressed
    if (forward !== 0 || strafe !== 0) {
      // Normalize diagonal movement
      const length = Math.sqrt(forward * forward + strafe * strafe);
      forward /= length;
      strafe /= length;

      // Get yaw in radians
      const yawRad = (rotationRef.current.yaw * Math.PI) / 180;

      // Calculate world-space movement
      const moveX = Math.sin(yawRad) * forward + Math.cos(yawRad) * strafe;
      const moveZ = Math.cos(yawRad) * forward - Math.sin(yawRad) * strafe;

      // Update position
      const newPos = {
        x: camera.position.x + moveX * speed * delta,
        y: camera.position.y, // Keep height constant
        z: camera.position.z + moveZ * speed * delta,
      };

      camera.position.set(newPos.x, newPos.y, newPos.z);
      updatePlayerPosition(newPos);
    }

    // Apply rotation
    const pitchRad = (rotationRef.current.pitch * Math.PI) / 180;
    const yawRad = (rotationRef.current.yaw * Math.PI) / 180;

    // Create rotation quaternion (yaw first, then pitch)
    const euler = new THREE.Euler(pitchRad, yawRad, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);
  });

  return null;
}

// Hook for using controls outside of R3F context
export function useFirstPersonInput() {
  const keysRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keysRef.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keysRef.current.backward = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keysRef.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keysRef.current.backward = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return keysRef;
}
