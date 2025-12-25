"use client";

import { useEffect, useRef, useCallback } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePlaytestStore } from "@/stores/playtest-store";

interface FirstPersonControlsProps {
  enabled?: boolean;
  movementSpeed?: number;
  lookSensitivity?: number;
  keyboardLookSpeed?: number;
  minPitch?: number;
  maxPitch?: number;
  jumpForce?: number;
  gravity?: number;
  verticalSpeed?: number;
  spinSpeed?: number;
}

export function FirstPersonControls({
  enabled = true,
  movementSpeed = 5,
  lookSensitivity = 0.002,
  keyboardLookSpeed = 90, // degrees per second
  minPitch = -89,
  maxPitch = 89,
  jumpForce = 8,
  gravity = 20,
  verticalSpeed = 4,
  spinSpeed = 180, // degrees per second
}: FirstPersonControlsProps) {
  const { camera, gl } = useThree();
  const { isPlaytestMode, isPaused, updatePlayerPosition, updatePlayerRotation, playerState } =
    usePlaytestStore();

  // Movement state
  const keysRef = useRef({
    // Movement (WASD)
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    // Vertical (T/G)
    up: false,
    down: false,
    // Jump (Space)
    jump: false,
    // Look (Arrows)
    lookUp: false,
    lookDown: false,
    lookLeft: false,
    lookRight: false,
    // Spin (Q)
    spin: false,
  });

  // Physics state
  const velocityRef = useRef({ x: 0, y: 0, z: 0 });
  const isGroundedRef = useRef(true);
  const groundLevelRef = useRef(1.6); // Default eye height

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

  // Handle mouse movement for looking
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
        // Movement - WASD
        case "KeyW":
          keysRef.current.forward = true;
          break;
        case "KeyS":
          keysRef.current.backward = true;
          break;
        case "KeyA":
          keysRef.current.left = true;
          break;
        case "KeyD":
          keysRef.current.right = true;
          break;

        // Sprint - Shift
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = true;
          break;

        // Look - Arrow keys
        case "ArrowUp":
          keysRef.current.lookUp = true;
          break;
        case "ArrowDown":
          keysRef.current.lookDown = true;
          break;
        case "ArrowLeft":
          keysRef.current.lookLeft = true;
          break;
        case "ArrowRight":
          keysRef.current.lookRight = true;
          break;

        // Vertical movement - T (up) / G (down)
        case "KeyT":
          keysRef.current.up = true;
          break;
        case "KeyG":
          keysRef.current.down = true;
          break;

        // Jump - Space
        case "Space":
          if (isGroundedRef.current) {
            keysRef.current.jump = true;
            velocityRef.current.y = jumpForce;
            isGroundedRef.current = false;
          }
          break;

        // Spin - Q
        case "KeyQ":
          keysRef.current.spin = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        // Movement
        case "KeyW":
          keysRef.current.forward = false;
          break;
        case "KeyS":
          keysRef.current.backward = false;
          break;
        case "KeyA":
          keysRef.current.left = false;
          break;
        case "KeyD":
          keysRef.current.right = false;
          break;

        // Sprint
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = false;
          break;

        // Look
        case "ArrowUp":
          keysRef.current.lookUp = false;
          break;
        case "ArrowDown":
          keysRef.current.lookDown = false;
          break;
        case "ArrowLeft":
          keysRef.current.lookLeft = false;
          break;
        case "ArrowRight":
          keysRef.current.lookRight = false;
          break;

        // Vertical
        case "KeyT":
          keysRef.current.up = false;
          break;
        case "KeyG":
          keysRef.current.down = false;
          break;

        // Jump
        case "Space":
          keysRef.current.jump = false;
          break;

        // Spin
        case "KeyQ":
          keysRef.current.spin = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled, isPaused, jumpForce]);

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
      groundLevelRef.current = playerState.position.y;
    }
  }, [isPlaytestMode, enabled, camera, playerState.position, playerState.rotation]);

  // Frame update
  useFrame((_, delta) => {
    if (!enabled || !isPlaytestMode || isPaused) return;

    const keys = keysRef.current;
    const speed = keys.sprint ? movementSpeed * 1.5 : movementSpeed;

    // ===== KEYBOARD LOOK =====
    // Arrow keys for looking around
    if (keys.lookUp) {
      rotationRef.current.pitch = Math.min(maxPitch, rotationRef.current.pitch + keyboardLookSpeed * delta);
    }
    if (keys.lookDown) {
      rotationRef.current.pitch = Math.max(minPitch, rotationRef.current.pitch - keyboardLookSpeed * delta);
    }
    if (keys.lookLeft) {
      rotationRef.current.yaw += keyboardLookSpeed * delta;
    }
    if (keys.lookRight) {
      rotationRef.current.yaw -= keyboardLookSpeed * delta;
    }

    // Q for spinning (fast rotation)
    if (keys.spin) {
      rotationRef.current.yaw += spinSpeed * delta;
    }

    // Normalize yaw
    rotationRef.current.yaw = rotationRef.current.yaw % 360;
    updatePlayerRotation(rotationRef.current);

    // ===== HORIZONTAL MOVEMENT =====
    let forward = 0;
    let strafe = 0;

    if (keys.forward) forward += 1;
    if (keys.backward) forward -= 1;
    if (keys.left) strafe -= 1;
    if (keys.right) strafe += 1;

    // Calculate movement direction
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
    // T/G for flying up/down
    let verticalMove = 0;
    if (keys.up) verticalMove += verticalSpeed * delta;
    if (keys.down) verticalMove -= verticalSpeed * delta;

    // Apply gravity if not using T/G vertical controls
    if (!keys.up && !keys.down) {
      velocityRef.current.y -= gravity * delta;
    } else {
      // Cancel gravity when using T/G
      velocityRef.current.y = 0;
    }

    // Calculate new position
    const newPos = {
      x: camera.position.x + moveX * speed * delta,
      y: camera.position.y + velocityRef.current.y * delta + verticalMove,
      z: camera.position.z + moveZ * speed * delta,
    };

    // Ground collision (simple floor at groundLevel)
    if (newPos.y <= groundLevelRef.current && !keys.up && !keys.down) {
      newPos.y = groundLevelRef.current;
      velocityRef.current.y = 0;
      isGroundedRef.current = true;
    } else if (keys.up || keys.down) {
      // Update ground level when flying
      groundLevelRef.current = newPos.y;
      isGroundedRef.current = true;
    }

    // Update camera position
    camera.position.set(newPos.x, newPos.y, newPos.z);
    updatePlayerPosition(newPos);

    // ===== APPLY ROTATION =====
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
    up: false,
    down: false,
    jump: false,
    lookUp: false,
    lookDown: false,
    lookLeft: false,
    lookRight: false,
    spin: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          keysRef.current.forward = true;
          break;
        case "KeyS":
          keysRef.current.backward = true;
          break;
        case "KeyA":
          keysRef.current.left = true;
          break;
        case "KeyD":
          keysRef.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = true;
          break;
        case "ArrowUp":
          keysRef.current.lookUp = true;
          break;
        case "ArrowDown":
          keysRef.current.lookDown = true;
          break;
        case "ArrowLeft":
          keysRef.current.lookLeft = true;
          break;
        case "ArrowRight":
          keysRef.current.lookRight = true;
          break;
        case "KeyT":
          keysRef.current.up = true;
          break;
        case "KeyG":
          keysRef.current.down = true;
          break;
        case "Space":
          keysRef.current.jump = true;
          break;
        case "KeyQ":
          keysRef.current.spin = true;
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "KeyW":
          keysRef.current.forward = false;
          break;
        case "KeyS":
          keysRef.current.backward = false;
          break;
        case "KeyA":
          keysRef.current.left = false;
          break;
        case "KeyD":
          keysRef.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keysRef.current.sprint = false;
          break;
        case "ArrowUp":
          keysRef.current.lookUp = false;
          break;
        case "ArrowDown":
          keysRef.current.lookDown = false;
          break;
        case "ArrowLeft":
          keysRef.current.lookLeft = false;
          break;
        case "ArrowRight":
          keysRef.current.lookRight = false;
          break;
        case "KeyT":
          keysRef.current.up = false;
          break;
        case "KeyG":
          keysRef.current.down = false;
          break;
        case "Space":
          keysRef.current.jump = false;
          break;
        case "KeyQ":
          keysRef.current.spin = false;
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
