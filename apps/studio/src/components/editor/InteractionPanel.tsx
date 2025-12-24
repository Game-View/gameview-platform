"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Zap,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Copy,
} from "lucide-react";
import {
  type Interaction,
  type TriggerType,
  type ActionType,
  type TriggerConfig,
  type ActionConfig,
  triggerLabels,
  actionLabels,
  createInteraction,
  createDefaultTrigger,
  createDefaultAction,
  describeInteraction,
} from "@/lib/interactions";

// Note: Icons for triggers and actions are defined but not yet used in dropdowns
// They can be added later for visual enhancement

interface InteractionPanelProps {
  interactions: Interaction[];
  onChange: (interactions: Interaction[]) => void;
  className?: string;
}

export function InteractionPanel({ interactions, onChange, className = "" }: InteractionPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddInteraction = () => {
    const newInteraction = createInteraction(`Interaction ${interactions.length + 1}`);
    onChange([...interactions, newInteraction]);
    setExpandedId(newInteraction.id);
  };

  const handleUpdateInteraction = (id: string, updates: Partial<Interaction>) => {
    onChange(interactions.map((i) => (i.id === id ? { ...i, ...updates } : i)));
  };

  const handleDeleteInteraction = (id: string) => {
    onChange(interactions.filter((i) => i.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleDuplicateInteraction = (interaction: Interaction) => {
    const duplicate: Interaction = {
      ...interaction,
      id: crypto.randomUUID(),
      name: `${interaction.name} (copy)`,
    };
    onChange([...interactions, duplicate]);
  };

  const handleToggleEnabled = (id: string) => {
    const interaction = interactions.find((i) => i.id === id);
    if (interaction) {
      handleUpdateInteraction(id, { enabled: !interaction.enabled });
    }
  };

  return (
    <div className={`bg-gv-neutral-900 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-800 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Zap className="h-4 w-4 text-gv-primary-400" />
          Interactions
        </h3>
        <button
          onClick={handleAddInteraction}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {/* Interactions list */}
      <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
        {interactions.length === 0 ? (
          <div className="text-center py-6">
            <Zap className="h-8 w-8 mx-auto text-gv-neutral-600 mb-2" />
            <p className="text-sm text-gv-neutral-500">No interactions yet</p>
            <p className="text-xs text-gv-neutral-600 mt-1">
              Add an interaction to make this object respond to players
            </p>
          </div>
        ) : (
          interactions.map((interaction) => (
            <InteractionCard
              key={interaction.id}
              interaction={interaction}
              isExpanded={expandedId === interaction.id}
              onToggleExpand={() => setExpandedId(expandedId === interaction.id ? null : interaction.id)}
              onToggleEnabled={() => handleToggleEnabled(interaction.id)}
              onUpdate={(updates) => handleUpdateInteraction(interaction.id, updates)}
              onDelete={() => handleDeleteInteraction(interaction.id)}
              onDuplicate={() => handleDuplicateInteraction(interaction)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Individual interaction card
interface InteractionCardProps {
  interaction: Interaction;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleEnabled: () => void;
  onUpdate: (updates: Partial<Interaction>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function InteractionCard({
  interaction,
  isExpanded,
  onToggleExpand,
  onToggleEnabled,
  onUpdate,
  onDelete,
  onDuplicate,
}: InteractionCardProps) {
  return (
    <div
      className={`border rounded-gv transition-colors ${
        interaction.enabled
          ? "border-gv-neutral-700 bg-gv-neutral-800/50"
          : "border-gv-neutral-800 bg-gv-neutral-900/50 opacity-60"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2">
        <button className="text-gv-neutral-500 cursor-grab">
          <GripVertical className="h-4 w-4" />
        </button>

        <button onClick={onToggleExpand} className="flex-1 flex items-center gap-2 text-left">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
          )}
          <span className="text-sm text-white font-medium truncate">{interaction.name}</span>
        </button>

        <button
          onClick={onToggleEnabled}
          className="p-1 rounded hover:bg-gv-neutral-700 transition-colors"
          title={interaction.enabled ? "Disable" : "Enable"}
        >
          {interaction.enabled ? (
            <ToggleRight className="h-4 w-4 text-green-500" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
          )}
        </button>

        <button
          onClick={onDuplicate}
          className="p-1 text-gv-neutral-400 hover:text-white rounded hover:bg-gv-neutral-700 transition-colors"
          title="Duplicate"
        >
          <Copy className="h-4 w-4" />
        </button>

        <button
          onClick={onDelete}
          className="p-1 text-gv-neutral-400 hover:text-red-400 rounded hover:bg-gv-neutral-700 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Summary (when collapsed) */}
      {!isExpanded && (
        <div className="px-3 pb-2 text-xs text-gv-neutral-400">
          {describeInteraction(interaction)}
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gv-neutral-700 p-3 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-gv-neutral-400 block mb-1">Name</label>
            <input
              type="text"
              value={interaction.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full px-2 py-1.5 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-xs text-gv-neutral-400 block mb-2">When...</label>
            <TriggerEditor
              trigger={interaction.trigger}
              onChange={(trigger) => onUpdate({ trigger })}
            />
          </div>

          {/* Actions */}
          <div>
            <label className="text-xs text-gv-neutral-400 block mb-2">Do...</label>
            <ActionsEditor
              actions={interaction.actions}
              onChange={(actions) => onUpdate({ actions })}
            />
          </div>

          {/* Advanced options */}
          <div className="pt-2 border-t border-gv-neutral-700 space-y-2">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-gv-neutral-400 block mb-1">Cooldown (ms)</label>
                <input
                  type="number"
                  value={interaction.cooldown || 0}
                  onChange={(e) => onUpdate({ cooldown: parseInt(e.target.value) || 0 })}
                  min={0}
                  step={100}
                  className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gv-neutral-400 block mb-1">Max triggers</label>
                <input
                  type="number"
                  value={interaction.maxTriggers || 0}
                  onChange={(e) => onUpdate({ maxTriggers: parseInt(e.target.value) || 0 })}
                  min={0}
                  placeholder="0 = unlimited"
                  className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Trigger editor
interface TriggerEditorProps {
  trigger: TriggerConfig;
  onChange: (trigger: TriggerConfig) => void;
}

function TriggerEditor({ trigger, onChange }: TriggerEditorProps) {
  const triggerTypes: TriggerType[] = [
    "click",
    "proximity",
    "collision",
    "collect",
    "enter_zone",
    "exit_zone",
    "look",
    "timer",
    "conditional",
  ];

  const handleTypeChange = (type: TriggerType) => {
    onChange(createDefaultTrigger(type));
  };

  return (
    <div className="space-y-2">
      {/* Trigger type selector */}
      <select
        value={trigger.type}
        onChange={(e) => handleTypeChange(e.target.value as TriggerType)}
        className="w-full px-2 py-1.5 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
      >
        {triggerTypes.map((type) => (
          <option key={type} value={type}>
            {triggerLabels[type]}
          </option>
        ))}
      </select>

      {/* Type-specific options */}
      {trigger.type === "proximity" && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gv-neutral-400">Radius:</label>
          <input
            type="number"
            value={trigger.radius}
            onChange={(e) => onChange({ ...trigger, radius: parseFloat(e.target.value) || 1 })}
            min={0.1}
            step={0.5}
            className="w-20 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <span className="text-xs text-gv-neutral-500">meters</span>
        </div>
      )}

      {trigger.type === "timer" && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gv-neutral-400">Delay:</label>
          <input
            type="number"
            value={trigger.delay / 1000}
            onChange={(e) => onChange({ ...trigger, delay: (parseFloat(e.target.value) || 1) * 1000 })}
            min={0.1}
            step={0.5}
            className="w-20 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <span className="text-xs text-gv-neutral-500">seconds</span>
          <label className="flex items-center gap-1 ml-2">
            <input
              type="checkbox"
              checked={trigger.repeat}
              onChange={(e) => onChange({ ...trigger, repeat: e.target.checked })}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-xs text-gv-neutral-400">Repeat</span>
          </label>
        </div>
      )}

      {(trigger.type === "enter_zone" || trigger.type === "exit_zone") && (
        <div className="flex items-center gap-2">
          <label className="text-xs text-gv-neutral-400">Size:</label>
          <input
            type="number"
            value={trigger.zoneSize.x}
            onChange={(e) =>
              onChange({
                ...trigger,
                zoneSize: { ...trigger.zoneSize, x: parseFloat(e.target.value) || 1 },
              })
            }
            min={0.1}
            step={0.5}
            className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <span className="text-xs text-gv-neutral-500">m</span>
        </div>
      )}

      {trigger.type === "collect" && (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={trigger.destroyOnCollect}
            onChange={(e) => onChange({ ...trigger, destroyOnCollect: e.target.checked })}
            className="rounded border-gv-neutral-600"
          />
          <span className="text-xs text-gv-neutral-400">Remove object after collection</span>
        </label>
      )}
    </div>
  );
}

// Actions editor
interface ActionsEditorProps {
  actions: ActionConfig[];
  onChange: (actions: ActionConfig[]) => void;
}

function ActionsEditor({ actions, onChange }: ActionsEditorProps) {
  const actionTypes: ActionType[] = [
    "play_sound",
    "show_message",
    "add_score",
    "add_inventory",
    "show_object",
    "hide_object",
    "teleport",
    "play_animation",
    "emit_particles",
    "vibrate",
    "complete_objective",
  ];

  const handleAddAction = () => {
    onChange([...actions, createDefaultAction("show_message")]);
  };

  const handleUpdateAction = (index: number, action: ActionConfig) => {
    const newActions = [...actions];
    newActions[index] = action;
    onChange(newActions);
  };

  const handleRemoveAction = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const handleTypeChange = (index: number, type: ActionType) => {
    const newActions = [...actions];
    newActions[index] = createDefaultAction(type);
    onChange(newActions);
  };

  return (
    <div className="space-y-2">
      {actions.map((action, index) => (
        <div key={index} className="flex items-start gap-2 p-2 bg-gv-neutral-700/50 rounded">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <select
                value={action.type}
                onChange={(e) => handleTypeChange(index, e.target.value as ActionType)}
                className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-gv-primary-500"
              >
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {actionLabels[type]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => handleRemoveAction(index)}
                className="p-1 text-gv-neutral-400 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>

            {/* Action-specific fields */}
            <ActionFields action={action} onChange={(a) => handleUpdateAction(index, a)} />
          </div>
        </div>
      ))}

      <button
        onClick={handleAddAction}
        className="w-full flex items-center justify-center gap-1 py-1.5 border border-dashed border-gv-neutral-600 rounded text-xs text-gv-neutral-400 hover:text-white hover:border-gv-neutral-500 transition-colors"
      >
        <Plus className="h-3 w-3" />
        Add action
      </button>
    </div>
  );
}

// Action-specific fields
interface ActionFieldsProps {
  action: ActionConfig;
  onChange: (action: ActionConfig) => void;
}

function ActionFields({ action, onChange }: ActionFieldsProps) {
  switch (action.type) {
    case "show_message":
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={action.message}
            onChange={(e) => onChange({ ...action, message: e.target.value })}
            placeholder="Enter message..."
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
          <div className="flex gap-2">
            <select
              value={action.style}
              onChange={(e) => onChange({ ...action, style: e.target.value as typeof action.style })}
              className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
            >
              <option value="toast">Toast</option>
              <option value="dialog">Dialog</option>
              <option value="subtitle">Subtitle</option>
            </select>
            <input
              type="number"
              value={action.duration / 1000}
              onChange={(e) => onChange({ ...action, duration: (parseFloat(e.target.value) || 3) * 1000 })}
              min={0}
              step={0.5}
              className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
              title="Duration (seconds)"
            />
          </div>
        </div>
      );

    case "add_score":
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={action.points}
            onChange={(e) => onChange({ ...action, points: parseInt(e.target.value) || 0 })}
            className="w-20 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
          <span className="text-xs text-gv-neutral-400">points</span>
          <label className="flex items-center gap-1 ml-auto">
            <input
              type="checkbox"
              checked={action.showPopup}
              onChange={(e) => onChange({ ...action, showPopup: e.target.checked })}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-xs text-gv-neutral-400">Show popup</span>
          </label>
        </div>
      );

    case "play_sound":
      return (
        <div className="space-y-1">
          <input
            type="text"
            value={action.audioUrl}
            onChange={(e) => onChange({ ...action, audioUrl: e.target.value })}
            placeholder="Audio URL..."
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
          <div className="flex items-center gap-2">
            <label className="text-xs text-gv-neutral-400">Volume:</label>
            <input
              type="range"
              value={action.volume}
              onChange={(e) => onChange({ ...action, volume: parseFloat(e.target.value) })}
              min={0}
              max={1}
              step={0.1}
              className="flex-1"
            />
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={action.loop}
                onChange={(e) => onChange({ ...action, loop: e.target.checked })}
                className="rounded border-gv-neutral-600"
              />
              <span className="text-xs text-gv-neutral-400">Loop</span>
            </label>
          </div>
        </div>
      );

    case "teleport":
      return (
        <div className="grid grid-cols-3 gap-1">
          <input
            type="number"
            value={action.destination.x}
            onChange={(e) =>
              onChange({ ...action, destination: { ...action.destination, x: parseFloat(e.target.value) || 0 } })
            }
            placeholder="X"
            step={0.5}
            className="px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
          <input
            type="number"
            value={action.destination.y}
            onChange={(e) =>
              onChange({ ...action, destination: { ...action.destination, y: parseFloat(e.target.value) || 0 } })
            }
            placeholder="Y"
            step={0.5}
            className="px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
          <input
            type="number"
            value={action.destination.z}
            onChange={(e) =>
              onChange({ ...action, destination: { ...action.destination, z: parseFloat(e.target.value) || 0 } })
            }
            placeholder="Z"
            step={0.5}
            className="px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
        </div>
      );

    case "emit_particles":
      return (
        <div className="flex items-center gap-2">
          <select
            value={action.particleType}
            onChange={(e) => onChange({ ...action, particleType: e.target.value as typeof action.particleType })}
            className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          >
            <option value="sparkle">Sparkle</option>
            <option value="confetti">Confetti</option>
            <option value="smoke">Smoke</option>
            <option value="fire">Fire</option>
          </select>
          <input
            type="number"
            value={action.duration / 1000}
            onChange={(e) => onChange({ ...action, duration: (parseFloat(e.target.value) || 1) * 1000 })}
            min={0.1}
            step={0.5}
            className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
            title="Duration (s)"
          />
        </div>
      );

    case "vibrate":
      return (
        <select
          value={action.pattern}
          onChange={(e) => onChange({ ...action, pattern: e.target.value as typeof action.pattern })}
          className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
        >
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
          <option value="double">Double</option>
          <option value="success">Success</option>
          <option value="error">Error</option>
        </select>
      );

    default:
      return null;
  }
}
