"use client";

import { useState } from "react";
import {
  Trophy,
  Target,
  Package,
  Star,
  Gift,
  Timer,
  Settings2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Info,
} from "lucide-react";
import {
  type GameConfig,
  type WinCondition,
  type WinConditionType,
  type Objective,
  type Reward,
  type RewardType,
  type ScoreRule,
  winConditionLabels,
  rewardTypeLabels,
  createWinCondition,
  createObjective,
  createReward,
  createScoreRule,
  describeWinCondition,
  defaultGameConfig,
} from "@/lib/game-logic";

interface GameLogicPanelProps {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
  className?: string;
}

type TabId = "conditions" | "scoring" | "inventory" | "objectives" | "rewards";

export function GameLogicPanel({
  config,
  onChange,
  className = "",
}: GameLogicPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("conditions");

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "conditions", label: "Win", icon: <Trophy className="h-4 w-4" /> },
    { id: "scoring", label: "Score", icon: <Star className="h-4 w-4" /> },
    { id: "inventory", label: "Items", icon: <Package className="h-4 w-4" /> },
    { id: "objectives", label: "Goals", icon: <Target className="h-4 w-4" /> },
    { id: "rewards", label: "Rewards", icon: <Gift className="h-4 w-4" /> },
  ];

  return (
    <div className={`bg-gv-neutral-900 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-800">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-gv-primary-400" />
          Game Logic
        </h2>
        <p className="text-xs text-gv-neutral-400 mt-1">
          Configure win conditions, scoring, and rewards
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gv-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
              activeTab === tab.id
                ? "text-gv-primary-400 border-b-2 border-gv-primary-400 bg-gv-neutral-800/50"
                : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800/30"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "conditions" && (
          <WinConditionsTab config={config} onChange={onChange} />
        )}
        {activeTab === "scoring" && (
          <ScoringTab config={config} onChange={onChange} />
        )}
        {activeTab === "inventory" && (
          <InventoryTab config={config} onChange={onChange} />
        )}
        {activeTab === "objectives" && (
          <ObjectivesTab config={config} onChange={onChange} />
        )}
        {activeTab === "rewards" && (
          <RewardsTab config={config} onChange={onChange} />
        )}
      </div>
    </div>
  );
}

// ============================================
// WIN CONDITIONS TAB
// ============================================

function WinConditionsTab({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAddCondition = (type: WinConditionType) => {
    const condition = createWinCondition(type, winConditionLabels[type]);
    onChange({
      ...config,
      winConditions: [...config.winConditions, condition],
    });
    setExpandedId(condition.id);
  };

  const handleUpdateCondition = (id: string, updates: Partial<WinCondition>) => {
    onChange({
      ...config,
      winConditions: config.winConditions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  const handleDeleteCondition = (id: string) => {
    onChange({
      ...config,
      winConditions: config.winConditions.filter((c) => c.id !== id),
    });
  };

  const conditionTypes: WinConditionType[] = [
    "collect_all",
    "collect_count",
    "reach_score",
    "complete_objectives",
    "time_limit",
  ];

  return (
    <div className="space-y-4">
      {/* Global time limit */}
      <div className="p-3 bg-gv-neutral-800/50 rounded-gv space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-gv-neutral-400" />
            <span className="text-sm text-white">Time Limit</span>
          </div>
          <button
            onClick={() =>
              onChange({
                ...config,
                showTimer: !config.showTimer,
                timeLimit: config.timeLimit ?? 300,
              })
            }
            className="p-1"
          >
            {config.showTimer ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gv-neutral-500" />
            )}
          </button>
        </div>

        {config.showTimer && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={Math.floor((config.timeLimit || 300) / 60)}
              onChange={(e) =>
                onChange({
                  ...config,
                  timeLimit:
                    (parseInt(e.target.value) || 0) * 60 +
                    ((config.timeLimit || 0) % 60),
                })
              }
              min={0}
              className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            />
            <span className="text-gv-neutral-400 text-sm">min</span>
            <input
              type="number"
              value={(config.timeLimit || 0) % 60}
              onChange={(e) =>
                onChange({
                  ...config,
                  timeLimit:
                    Math.floor((config.timeLimit || 0) / 60) * 60 +
                    (parseInt(e.target.value) || 0),
                })
              }
              min={0}
              max={59}
              className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            />
            <span className="text-gv-neutral-400 text-sm">sec</span>
          </div>
        )}
      </div>

      {/* Win conditions list */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Win Conditions</h3>
          <div className="relative group">
            <button className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded transition-colors">
              <Plus className="h-3 w-3" />
              Add
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              {conditionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => handleAddCondition(type)}
                  className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gv-neutral-700 first:rounded-t-gv last:rounded-b-gv"
                >
                  {winConditionLabels[type]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {config.winConditions.length === 0 ? (
          <div className="text-center py-6 text-gv-neutral-500 text-sm">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No win conditions yet</p>
            <p className="text-xs mt-1">Add a condition to define how players win</p>
          </div>
        ) : (
          <div className="space-y-2">
            {config.winConditions.map((condition) => (
              <WinConditionCard
                key={condition.id}
                condition={condition}
                isExpanded={expandedId === condition.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === condition.id ? null : condition.id)
                }
                onUpdate={(updates) => handleUpdateCondition(condition.id, updates)}
                onDelete={() => handleDeleteCondition(condition.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Win message */}
      <div className="space-y-2 pt-4 border-t border-gv-neutral-700">
        <h3 className="text-sm font-medium text-white">Victory Message</h3>
        <input
          type="text"
          value={config.winTitle}
          onChange={(e) => onChange({ ...config, winTitle: e.target.value })}
          placeholder="Victory title..."
          className="w-full px-3 py-2 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
        />
        <textarea
          value={config.winMessage}
          onChange={(e) => onChange({ ...config, winMessage: e.target.value })}
          placeholder="Victory message..."
          rows={2}
          className="w-full px-3 py-2 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm resize-none"
        />
      </div>
    </div>
  );
}

function WinConditionCard({
  condition,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onDelete,
}: {
  condition: WinCondition;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (updates: Partial<WinCondition>) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`border rounded-gv ${
        condition.enabled
          ? "border-gv-neutral-700 bg-gv-neutral-800/50"
          : "border-gv-neutral-800 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 p-2">
        <button onClick={onToggleExpand} className="flex-1 flex items-center gap-2 text-left">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gv-neutral-400" />
          )}
          <span className="text-sm text-white">{condition.name}</span>
        </button>

        <button
          onClick={() => onUpdate({ enabled: !condition.enabled })}
          className="p-1"
        >
          {condition.enabled ? (
            <ToggleRight className="h-4 w-4 text-green-500" />
          ) : (
            <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
          )}
        </button>

        <button
          onClick={onDelete}
          className="p-1 text-gv-neutral-400 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!isExpanded && (
        <div className="px-3 pb-2 text-xs text-gv-neutral-400">
          {describeWinCondition(condition)}
        </div>
      )}

      {isExpanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-gv-neutral-700">
          <input
            type="text"
            value={condition.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />

          <WinConditionConfigEditor
            condition={condition}
            onUpdate={onUpdate}
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={condition.required}
              onChange={(e) => onUpdate({ required: e.target.checked })}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-xs text-gv-neutral-400">Required to win</span>
          </label>
        </div>
      )}
    </div>
  );
}

function WinConditionConfigEditor({
  condition,
  onUpdate,
}: {
  condition: WinCondition;
  onUpdate: (updates: Partial<WinCondition>) => void;
}) {
  const { config } = condition;

  switch (config.type) {
    case "collect_all":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={config.category || ""}
            onChange={(e) =>
              onUpdate({
                config: { ...config, category: e.target.value || undefined },
              })
            }
            placeholder="Category (empty = all items)"
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
        </div>
      );

    case "collect_count":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gv-neutral-400">Collect</span>
          <input
            type="number"
            value={config.count}
            onChange={(e) =>
              onUpdate({
                config: { ...config, count: parseInt(e.target.value) || 1 },
              })
            }
            min={1}
            className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <span className="text-sm text-gv-neutral-400">items</span>
        </div>
      );

    case "reach_score":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gv-neutral-400">Target:</span>
          <input
            type="number"
            value={config.targetScore}
            onChange={(e) =>
              onUpdate({
                config: { ...config, targetScore: parseInt(e.target.value) || 0 },
              })
            }
            min={0}
            step={10}
            className="w-24 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <span className="text-sm text-gv-neutral-400">points</span>
        </div>
      );

    case "time_limit":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gv-neutral-400">Complete in</span>
            <input
              type="number"
              value={Math.floor(config.timeLimit / 60)}
              onChange={(e) =>
                onUpdate({
                  config: {
                    ...config,
                    timeLimit:
                      (parseInt(e.target.value) || 0) * 60 + (config.timeLimit % 60),
                  },
                })
              }
              min={0}
              className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            />
            <span className="text-sm text-gv-neutral-400">:</span>
            <input
              type="number"
              value={config.timeLimit % 60}
              onChange={(e) =>
                onUpdate({
                  config: {
                    ...config,
                    timeLimit:
                      Math.floor(config.timeLimit / 60) * 60 +
                      (parseInt(e.target.value) || 0),
                  },
                })
              }
              min={0}
              max={59}
              className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.failOnExpire}
              onChange={(e) =>
                onUpdate({ config: { ...config, failOnExpire: e.target.checked } })
              }
              className="rounded border-gv-neutral-600"
            />
            <span className="text-xs text-gv-neutral-400">Fail if time runs out</span>
          </label>
        </div>
      );

    default:
      return null;
  }
}

// ============================================
// SCORING TAB
// ============================================

function ScoringTab({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}) {
  const handleAddRule = () => {
    const rule = createScoreRule("New Rule", 10);
    onChange({
      ...config,
      scoreRules: [...config.scoreRules, rule],
    });
  };

  const handleUpdateRule = (id: string, updates: Partial<ScoreRule>) => {
    onChange({
      ...config,
      scoreRules: config.scoreRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const handleDeleteRule = (id: string) => {
    onChange({
      ...config,
      scoreRules: config.scoreRules.filter((r) => r.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      {/* Scoring settings */}
      <div className="p-3 bg-gv-neutral-800/50 rounded-gv space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Enable Scoring</span>
          <button
            onClick={() =>
              onChange({
                ...config,
                scoring: { ...config.scoring, enabled: !config.scoring.enabled },
              })
            }
          >
            {config.scoring.enabled ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gv-neutral-500" />
            )}
          </button>
        </div>

        {config.scoring.enabled && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gv-neutral-400">Show in HUD</span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    scoring: { ...config.scoring, showInHUD: !config.scoring.showInHUD },
                  })
                }
              >
                {config.scoring.showInHUD ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gv-neutral-400">Show popups (+10)</span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    scoring: { ...config.scoring, showPopups: !config.scoring.showPopups },
                  })
                }
              >
                {config.scoring.showPopups ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gv-neutral-400">Track high score</span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    scoring: {
                      ...config.scoring,
                      trackHighScore: !config.scoring.trackHighScore,
                    },
                  })
                }
              >
                {config.scoring.trackHighScore ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gv-neutral-400">Starting score:</span>
              <input
                type="number"
                value={config.scoring.startingScore}
                onChange={(e) =>
                  onChange({
                    ...config,
                    scoring: {
                      ...config.scoring,
                      startingScore: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
                className="w-20 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
              />
            </div>
          </>
        )}
      </div>

      {/* Score rules */}
      {config.scoring.enabled && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Score Rules</h3>
            <button
              onClick={handleAddRule}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded"
            >
              <Plus className="h-3 w-3" />
              Add
            </button>
          </div>

          {config.scoreRules.length === 0 ? (
            <div className="text-center py-4 text-gv-neutral-500 text-sm">
              <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
              <p>No score rules</p>
              <p className="text-xs">Use object interactions to add points</p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.scoreRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 p-2 bg-gv-neutral-800/50 rounded-gv"
                >
                  <input
                    type="text"
                    value={rule.name}
                    onChange={(e) => handleUpdateRule(rule.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                  />
                  <input
                    type="number"
                    value={rule.points}
                    onChange={(e) =>
                      handleUpdateRule(rule.id, { points: parseInt(e.target.value) || 0 })
                    }
                    className="w-16 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm text-center"
                  />
                  <span className="text-xs text-gv-neutral-400">pts</span>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-gv-neutral-400 hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// INVENTORY TAB
// ============================================

function InventoryTab({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="p-3 bg-gv-neutral-800/50 rounded-gv space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white">Enable Inventory</span>
          <button
            onClick={() =>
              onChange({
                ...config,
                inventory: { ...config.inventory, enabled: !config.inventory.enabled },
              })
            }
          >
            {config.inventory.enabled ? (
              <ToggleRight className="h-5 w-5 text-green-500" />
            ) : (
              <ToggleLeft className="h-5 w-5 text-gv-neutral-500" />
            )}
          </button>
        </div>

        {config.inventory.enabled && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gv-neutral-400">Show in HUD</span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    inventory: {
                      ...config.inventory,
                      showInHUD: !config.inventory.showInHUD,
                    },
                  })
                }
              >
                {config.inventory.showInHUD ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gv-neutral-400">Show count (X of Y)</span>
              <button
                onClick={() =>
                  onChange({
                    ...config,
                    inventory: {
                      ...config.inventory,
                      showCount: !config.inventory.showCount,
                    },
                  })
                }
              >
                {config.inventory.showCount ? (
                  <ToggleRight className="h-4 w-4 text-green-500" />
                ) : (
                  <ToggleLeft className="h-4 w-4 text-gv-neutral-500" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gv-neutral-400">Max slots:</span>
              <input
                type="number"
                value={config.inventory.maxSlots}
                onChange={(e) =>
                  onChange({
                    ...config,
                    inventory: {
                      ...config.inventory,
                      maxSlots: parseInt(e.target.value) || 0,
                    },
                  })
                }
                min={0}
                placeholder="0 = unlimited"
                className="w-20 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
              />
              <span className="text-xs text-gv-neutral-500">(0 = unlimited)</span>
            </div>

            <div>
              <span className="text-sm text-gv-neutral-400 block mb-1">Display style:</span>
              <select
                value={config.inventory.displayStyle}
                onChange={(e) =>
                  onChange({
                    ...config,
                    inventory: {
                      ...config.inventory,
                      displayStyle: e.target.value as "grid" | "list" | "minimal",
                    },
                  })
                }
                className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
              >
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </>
        )}
      </div>

      {config.inventory.enabled && (
        <div className="p-3 bg-gv-neutral-800/30 rounded-gv">
          <div className="flex items-center gap-2 text-gv-neutral-400">
            <Info className="h-4 w-4" />
            <p className="text-xs">
              Items are collected via object interactions. Add a &quot;collect&quot; trigger
              with &quot;add to inventory&quot; action.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// OBJECTIVES TAB
// ============================================

function ObjectivesTab({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}) {
  const handleAddObjective = () => {
    const objective = createObjective(`Objective ${config.objectives.length + 1}`);
    objective.order = config.objectives.length;
    onChange({
      ...config,
      objectives: [...config.objectives, objective],
    });
  };

  const handleUpdateObjective = (id: string, updates: Partial<Objective>) => {
    onChange({
      ...config,
      objectives: config.objectives.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
    });
  };

  const handleDeleteObjective = (id: string) => {
    onChange({
      ...config,
      objectives: config.objectives.filter((o) => o.id !== id),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Objectives</h3>
        <button
          onClick={handleAddObjective}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {config.objectives.length === 0 ? (
        <div className="text-center py-6 text-gv-neutral-500 text-sm">
          <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No objectives yet</p>
          <p className="text-xs mt-1">Add goals for players to complete</p>
        </div>
      ) : (
        <div className="space-y-2">
          {config.objectives.map((objective) => (
            <div
              key={objective.id}
              className="p-3 bg-gv-neutral-800/50 rounded-gv space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={objective.name}
                  onChange={(e) =>
                    handleUpdateObjective(objective.id, { name: e.target.value })
                  }
                  className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                />
                <select
                  value={objective.type}
                  onChange={(e) =>
                    handleUpdateObjective(objective.id, {
                      type: e.target.value as Objective["type"],
                    })
                  }
                  className="px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="bonus">Bonus</option>
                </select>
                <button
                  onClick={() => handleDeleteObjective(objective.id)}
                  className="p-1 text-gv-neutral-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <input
                type="text"
                value={objective.description || ""}
                onChange={(e) =>
                  handleUpdateObjective(objective.id, { description: e.target.value })
                }
                placeholder="Description (optional)"
                className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
              />

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={objective.hidden}
                    onChange={(e) =>
                      handleUpdateObjective(objective.id, { hidden: e.target.checked })
                    }
                    className="rounded border-gv-neutral-600"
                  />
                  <span className="text-xs text-gv-neutral-400">Hidden</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={objective.showProgress}
                    onChange={(e) =>
                      handleUpdateObjective(objective.id, {
                        showProgress: e.target.checked,
                      })
                    }
                    className="rounded border-gv-neutral-600"
                  />
                  <span className="text-xs text-gv-neutral-400">Show progress</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// REWARDS TAB
// ============================================

function RewardsTab({
  config,
  onChange,
}: {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
}) {
  const handleAddReward = (type: RewardType) => {
    const reward = createReward(type, rewardTypeLabels[type]);
    onChange({
      ...config,
      rewards: [...config.rewards, reward],
    });
  };

  const handleUpdateReward = (id: string, updates: Partial<Reward>) => {
    onChange({
      ...config,
      rewards: config.rewards.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    });
  };

  const handleDeleteReward = (id: string) => {
    onChange({
      ...config,
      rewards: config.rewards.filter((r) => r.id !== id),
    });
  };

  const rewardTypes: RewardType[] = [
    "achievement",
    "badge",
    "bonus_points",
    "custom_message",
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Completion Rewards</h3>
        <div className="relative group">
          <button className="flex items-center gap-1 px-2 py-1 text-xs bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded">
            <Plus className="h-3 w-3" />
            Add
          </button>
          <div className="absolute right-0 mt-1 w-40 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            {rewardTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleAddReward(type)}
                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-gv-neutral-700 first:rounded-t-gv last:rounded-b-gv"
              >
                {rewardTypeLabels[type]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {config.rewards.length === 0 ? (
        <div className="text-center py-6 text-gv-neutral-500 text-sm">
          <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No rewards yet</p>
          <p className="text-xs mt-1">Add rewards for completing the experience</p>
        </div>
      ) : (
        <div className="space-y-2">
          {config.rewards.map((reward) => (
            <div
              key={reward.id}
              className="p-3 bg-gv-neutral-800/50 rounded-gv space-y-2"
            >
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-yellow-500" />
                <input
                  type="text"
                  value={reward.name}
                  onChange={(e) =>
                    handleUpdateReward(reward.id, { name: e.target.value })
                  }
                  className="flex-1 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
                />
                <span className="text-xs text-gv-neutral-400">
                  {rewardTypeLabels[reward.type]}
                </span>
                <button
                  onClick={() => handleDeleteReward(reward.id)}
                  className="p-1 text-gv-neutral-400 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <RewardConfigEditor
                reward={reward}
                onUpdate={(updates) => handleUpdateReward(reward.id, updates)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Win actions */}
      <div className="pt-4 border-t border-gv-neutral-700 space-y-2">
        <h3 className="text-sm font-medium text-white">On Victory</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.winActions.some((a) => a.type === "show_rewards")}
              onChange={(e) => {
                const actions = e.target.checked
                  ? [...config.winActions, { type: "show_rewards" as const }]
                  : config.winActions.filter((a) => a.type !== "show_rewards");
                onChange({ ...config, winActions: actions });
              }}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-sm text-gv-neutral-400">Show rewards</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.winActions.some((a) => a.type === "confetti")}
              onChange={(e) => {
                const actions = e.target.checked
                  ? [...config.winActions, { type: "confetti" as const }]
                  : config.winActions.filter((a) => a.type !== "confetti");
                onChange({ ...config, winActions: actions });
              }}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-sm text-gv-neutral-400">Show confetti</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={config.winActions.some((a) => a.type === "show_leaderboard")}
              onChange={(e) => {
                const actions = e.target.checked
                  ? [...config.winActions, { type: "show_leaderboard" as const }]
                  : config.winActions.filter((a) => a.type !== "show_leaderboard");
                onChange({ ...config, winActions: actions });
              }}
              className="rounded border-gv-neutral-600"
            />
            <span className="text-sm text-gv-neutral-400">Show leaderboard</span>
          </label>
        </div>
      </div>
    </div>
  );
}

function RewardConfigEditor({
  reward,
  onUpdate,
}: {
  reward: Reward;
  onUpdate: (updates: Partial<Reward>) => void;
}) {
  const { config } = reward;

  switch (config.type) {
    case "achievement":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={config.title}
            onChange={(e) =>
              onUpdate({ config: { ...config, title: e.target.value } })
            }
            placeholder="Achievement title"
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <input
            type="text"
            value={config.description}
            onChange={(e) =>
              onUpdate({ config: { ...config, description: e.target.value } })
            }
            placeholder="Description"
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs"
          />
        </div>
      );

    case "bonus_points":
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gv-neutral-400">Bonus:</span>
          <input
            type="number"
            value={config.points}
            onChange={(e) =>
              onUpdate({ config: { ...config, points: parseInt(e.target.value) || 0 } })
            }
            className="w-20 px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <span className="text-sm text-gv-neutral-400">points</span>
        </div>
      );

    case "custom_message":
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={config.title}
            onChange={(e) =>
              onUpdate({ config: { ...config, title: e.target.value } })
            }
            placeholder="Message title"
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
          />
          <textarea
            value={config.message}
            onChange={(e) =>
              onUpdate({ config: { ...config, message: e.target.value } })
            }
            placeholder="Message content"
            rows={2}
            className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-xs resize-none"
          />
        </div>
      );

    case "badge":
      return (
        <input
          type="text"
          value={config.badgeName}
          onChange={(e) =>
            onUpdate({ config: { ...config, badgeName: e.target.value } })
          }
          placeholder="Badge name"
          className="w-full px-2 py-1 bg-gv-neutral-700 border border-gv-neutral-600 rounded text-white text-sm"
        />
      );

    default:
      return null;
  }
}

// Export default config for use elsewhere
export { defaultGameConfig };
