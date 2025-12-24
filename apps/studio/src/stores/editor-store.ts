import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type { PlacedObject, ObjectTransform } from "@/lib/objects";

// Transform modes
export type TransformMode = "translate" | "rotate" | "scale";

// Editor action for undo/redo
export interface EditorAction {
  type: "add" | "remove" | "transform" | "update";
  objectId: string;
  before?: PlacedObject | null;
  after?: PlacedObject | null;
}

// Editor state
interface EditorState {
  // Selection
  selectedObjectId: string | null;
  hoveredObjectId: string | null;

  // Transform
  transformMode: TransformMode;
  isTransforming: boolean;
  snapEnabled: boolean;
  snapTranslate: number;
  snapRotate: number;
  snapScale: number;

  // Objects
  placedObjects: PlacedObject[];

  // History for undo/redo
  history: EditorAction[];
  historyIndex: number;
  maxHistorySize: number;

  // UI state
  showGrid: boolean;
  showGizmo: boolean;

  // Dirty flag for auto-save
  isDirty: boolean;
  lastSavedAt: number | null;
}

// Editor actions
interface EditorActions {
  // Selection
  selectObject: (id: string | null) => void;
  setHoveredObject: (id: string | null) => void;

  // Transform mode
  setTransformMode: (mode: TransformMode) => void;
  setIsTransforming: (isTransforming: boolean) => void;
  toggleSnap: () => void;
  setSnapValues: (translate?: number, rotate?: number, scale?: number) => void;

  // Object operations
  setPlacedObjects: (objects: PlacedObject[]) => void;
  addObject: (object: PlacedObject) => void;
  removeObject: (id: string) => void;
  updateObjectTransform: (id: string, transform: ObjectTransform) => void;
  updateObject: (id: string, updates: Partial<PlacedObject>) => void;
  duplicateObject: (id: string) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: (action: EditorAction) => void;
  clearHistory: () => void;

  // UI
  toggleGrid: () => void;
  toggleGizmo: () => void;

  // Save state
  markClean: () => void;
  getSelectedObject: () => PlacedObject | null;
}

export const useEditorStore = create<EditorState & EditorActions>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    selectedObjectId: null,
    hoveredObjectId: null,
    transformMode: "translate",
    isTransforming: false,
    snapEnabled: true,
    snapTranslate: 0.25,
    snapRotate: 15,
    snapScale: 0.1,
    placedObjects: [],
    history: [],
    historyIndex: -1,
    maxHistorySize: 50,
    showGrid: true,
    showGizmo: true,
    isDirty: false,
    lastSavedAt: null,

    // Selection
    selectObject: (id) => {
      set({ selectedObjectId: id });
    },

    setHoveredObject: (id) => {
      set({ hoveredObjectId: id });
    },

    // Transform mode
    setTransformMode: (mode) => {
      set({ transformMode: mode });
    },

    setIsTransforming: (isTransforming) => {
      set({ isTransforming });
    },

    toggleSnap: () => {
      set((state) => ({ snapEnabled: !state.snapEnabled }));
    },

    setSnapValues: (translate, rotate, scale) => {
      set((state) => ({
        snapTranslate: translate ?? state.snapTranslate,
        snapRotate: rotate ?? state.snapRotate,
        snapScale: scale ?? state.snapScale,
      }));
    },

    // Object operations
    setPlacedObjects: (objects) => {
      set({ placedObjects: objects, isDirty: false });
    },

    addObject: (object) => {
      const state = get();
      const action: EditorAction = {
        type: "add",
        objectId: object.instanceId,
        before: null,
        after: object,
      };

      set({
        placedObjects: [...state.placedObjects, object],
        selectedObjectId: object.instanceId,
        isDirty: true,
      });

      get().pushHistory(action);
    },

    removeObject: (id) => {
      const state = get();
      const object = state.placedObjects.find((o) => o.instanceId === id);
      if (!object) return;

      const action: EditorAction = {
        type: "remove",
        objectId: id,
        before: object,
        after: null,
      };

      set({
        placedObjects: state.placedObjects.filter((o) => o.instanceId !== id),
        selectedObjectId: state.selectedObjectId === id ? null : state.selectedObjectId,
        isDirty: true,
      });

      get().pushHistory(action);
    },

    updateObjectTransform: (id, transform) => {
      const state = get();
      const objectIndex = state.placedObjects.findIndex((o) => o.instanceId === id);
      if (objectIndex === -1) return;

      const oldObject = state.placedObjects[objectIndex];
      const newObject = { ...oldObject, transform };

      const action: EditorAction = {
        type: "transform",
        objectId: id,
        before: oldObject,
        after: newObject,
      };

      const newObjects = [...state.placedObjects];
      newObjects[objectIndex] = newObject;

      set({ placedObjects: newObjects, isDirty: true });
      get().pushHistory(action);
    },

    updateObject: (id, updates) => {
      const state = get();
      const objectIndex = state.placedObjects.findIndex((o) => o.instanceId === id);
      if (objectIndex === -1) return;

      const oldObject = state.placedObjects[objectIndex];
      const newObject = { ...oldObject, ...updates };

      const action: EditorAction = {
        type: "update",
        objectId: id,
        before: oldObject,
        after: newObject,
      };

      const newObjects = [...state.placedObjects];
      newObjects[objectIndex] = newObject;

      set({ placedObjects: newObjects, isDirty: true });
      get().pushHistory(action);
    },

    duplicateObject: (id) => {
      const state = get();
      const object = state.placedObjects.find((o) => o.instanceId === id);
      if (!object) return;

      const newObject: PlacedObject = {
        ...object,
        instanceId: crypto.randomUUID(),
        name: `${object.name} (copy)`,
        transform: {
          ...object.transform,
          position: {
            x: object.transform.position.x + 0.5,
            y: object.transform.position.y,
            z: object.transform.position.z + 0.5,
          },
        },
      };

      get().addObject(newObject);
    },

    // History
    pushHistory: (action) => {
      const state = get();
      // Remove any redo history
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(action);

      // Limit history size
      if (newHistory.length > state.maxHistorySize) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const state = get();
      if (!get().canUndo()) return;

      const action = state.history[state.historyIndex];
      const newObjects = [...state.placedObjects];

      switch (action.type) {
        case "add":
          // Remove the added object
          const addIndex = newObjects.findIndex((o) => o.instanceId === action.objectId);
          if (addIndex !== -1) newObjects.splice(addIndex, 1);
          break;

        case "remove":
          // Restore the removed object
          if (action.before) newObjects.push(action.before);
          break;

        case "transform":
        case "update":
          // Restore previous state
          const updateIndex = newObjects.findIndex((o) => o.instanceId === action.objectId);
          if (updateIndex !== -1 && action.before) {
            newObjects[updateIndex] = action.before;
          }
          break;
      }

      set({
        placedObjects: newObjects,
        historyIndex: state.historyIndex - 1,
        isDirty: true,
        selectedObjectId:
          action.type === "add" ? null : action.type === "remove" ? action.objectId : state.selectedObjectId,
      });
    },

    redo: () => {
      const state = get();
      if (!get().canRedo()) return;

      const action = state.history[state.historyIndex + 1];
      const newObjects = [...state.placedObjects];

      switch (action.type) {
        case "add":
          // Re-add the object
          if (action.after) newObjects.push(action.after);
          break;

        case "remove":
          // Re-remove the object
          const removeIndex = newObjects.findIndex((o) => o.instanceId === action.objectId);
          if (removeIndex !== -1) newObjects.splice(removeIndex, 1);
          break;

        case "transform":
        case "update":
          // Apply new state
          const updateIndex = newObjects.findIndex((o) => o.instanceId === action.objectId);
          if (updateIndex !== -1 && action.after) {
            newObjects[updateIndex] = action.after;
          }
          break;
      }

      set({
        placedObjects: newObjects,
        historyIndex: state.historyIndex + 1,
        isDirty: true,
        selectedObjectId:
          action.type === "add" ? action.objectId : action.type === "remove" ? null : state.selectedObjectId,
      });
    },

    canUndo: () => {
      const state = get();
      return state.historyIndex >= 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    clearHistory: () => {
      set({ history: [], historyIndex: -1 });
    },

    // UI
    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }));
    },

    toggleGizmo: () => {
      set((state) => ({ showGizmo: !state.showGizmo }));
    },

    // Save state
    markClean: () => {
      set({ isDirty: false, lastSavedAt: Date.now() });
    },

    getSelectedObject: () => {
      const state = get();
      if (!state.selectedObjectId) return null;
      return state.placedObjects.find((o) => o.instanceId === state.selectedObjectId) || null;
    },
  }))
);

// Keyboard shortcut helpers
export const EDITOR_SHORTCUTS = {
  translate: "w",
  rotate: "e",
  scale: "r",
  delete: "Delete",
  duplicate: "d",
  undo: "z",
  redo: "y",
  snap: "s",
  deselect: "Escape",
} as const;
