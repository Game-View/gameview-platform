"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Box,
  Target,
  Trophy,
  Volume2,
  Zap,
  DoorOpen,
  Star,
} from "lucide-react";
import type { GameConfig } from "@/lib/game-logic";
import type { PlacedObject } from "@/lib/objects";
import type { PortalConfig } from "@/lib/scene-navigation";

interface TestingChecklistProps {
  gameConfig: GameConfig;
  placedObjects: PlacedObject[];
  portals?: PortalConfig[];
  className?: string;
}

interface ChecklistItem {
  id: string;
  category: string;
  description: string;
  icon: React.ReactNode;
  priority: "high" | "medium" | "low";
  autoCheck?: boolean;
  status?: "pass" | "fail" | "pending";
  details?: string;
}

/**
 * Auto-generated testing checklist based on game configuration
 * Helps creators validate their experience before publishing
 */
export function TestingChecklist({
  gameConfig,
  placedObjects,
  portals = [],
  className = "",
}: TestingChecklistProps) {
  const checklist = useMemo(() => {
    const items: ChecklistItem[] = [];

    // Scene & Objects Checks
    items.push({
      id: "scene-loads",
      category: "Scene",
      description: "Scene loads without errors",
      icon: <Box className="h-4 w-4" />,
      priority: "high",
      autoCheck: true,
      status: "pass", // If we got here, scene loaded
    });

    if (placedObjects.length > 0) {
      items.push({
        id: "objects-visible",
        category: "Objects",
        description: `All ${placedObjects.length} placed objects are visible`,
        icon: <Box className="h-4 w-4" />,
        priority: "high",
        details: placedObjects.map(o => o.name).join(", "),
      });

      // Check for objects with interactions
      const interactiveObjects = placedObjects.filter(
        (o) => o.interactions && o.interactions.length > 0
      );
      if (interactiveObjects.length > 0) {
        items.push({
          id: "interactions-work",
          category: "Interactions",
          description: `Test all ${interactiveObjects.length} interactive objects`,
          icon: <Zap className="h-4 w-4" />,
          priority: "high",
          details: interactiveObjects.map(o => `${o.name} (${o.interactions?.length} interactions)`).join(", "),
        });

        // Check for click interactions
        const clickObjects = interactiveObjects.filter(
          (o) => o.interactions?.some((i) => i.trigger.type === "click")
        );
        if (clickObjects.length > 0) {
          items.push({
            id: "click-interactions",
            category: "Interactions",
            description: `Test ${clickObjects.length} click interactions`,
            icon: <Zap className="h-4 w-4" />,
            priority: "medium",
          });
        }

        // Check for collect interactions
        const collectObjects = interactiveObjects.filter(
          (o) => o.interactions?.some((i) => i.trigger.type === "collect")
        );
        if (collectObjects.length > 0) {
          items.push({
            id: "collect-interactions",
            category: "Interactions",
            description: `Test ${collectObjects.length} collectible items`,
            icon: <Zap className="h-4 w-4" />,
            priority: "high",
          });
        }

        // Check for audio actions
        const audioObjects = interactiveObjects.filter((o) =>
          o.interactions?.some((i) =>
            i.actions.some((a) => a.type === "play_sound")
          )
        );
        if (audioObjects.length > 0) {
          items.push({
            id: "audio-plays",
            category: "Audio",
            description: `Verify ${audioObjects.length} sound effects play correctly`,
            icon: <Volume2 className="h-4 w-4" />,
            priority: "medium",
          });
        }
      }
    }

    // Objectives Checks
    if (gameConfig.objectives.length > 0) {
      items.push({
        id: "objectives-completable",
        category: "Objectives",
        description: `All ${gameConfig.objectives.length} objectives can be completed`,
        icon: <Target className="h-4 w-4" />,
        priority: "high",
        details: gameConfig.objectives.map(o => o.name).join(", "),
      });

      gameConfig.objectives.forEach((objective) => {
        items.push({
          id: `objective-${objective.id}`,
          category: "Objectives",
          description: `Complete: "${objective.name}"`,
          icon: <Target className="h-4 w-4" />,
          priority: objective.type === "primary" ? "high" : "medium",
        });
      });
    }

    // Win Conditions Checks
    const enabledWinConditions = gameConfig.winConditions.filter((c) => c.enabled);
    if (enabledWinConditions.length > 0) {
      items.push({
        id: "win-condition-triggers",
        category: "Win Conditions",
        description: "Victory screen appears when conditions are met",
        icon: <Trophy className="h-4 w-4" />,
        priority: "high",
      });

      enabledWinConditions.forEach((condition) => {
        let conditionDesc = "";
        switch (condition.type) {
          case "collect_all":
            conditionDesc = "Collect all required items";
            break;
          case "collect_count":
            conditionDesc = `Collect ${(condition.config as { count: number }).count} items`;
            break;
          case "reach_score":
            conditionDesc = `Reach score of ${(condition.config as { targetScore: number }).targetScore}`;
            break;
          case "complete_objectives":
            conditionDesc = "Complete all required objectives";
            break;
          case "time_limit":
            conditionDesc = `Complete within time limit`;
            break;
        }

        items.push({
          id: `win-${condition.id}`,
          category: "Win Conditions",
          description: conditionDesc,
          icon: <Trophy className="h-4 w-4" />,
          priority: condition.required ? "high" : "medium",
        });
      });
    }

    // Scoring Checks
    if (gameConfig.scoring.enabled) {
      items.push({
        id: "score-updates",
        category: "Scoring",
        description: "Score updates correctly when actions trigger",
        icon: <Star className="h-4 w-4" />,
        priority: "medium",
      });

      if (gameConfig.scoring.showPopups) {
        items.push({
          id: "score-popups",
          category: "Scoring",
          description: "Score popups appear when points are earned",
          icon: <Star className="h-4 w-4" />,
          priority: "low",
        });
      }
    }

    // Portal Checks
    if (portals.length > 0) {
      items.push({
        id: "portals-work",
        category: "Navigation",
        description: `Test all ${portals.length} portals lead to correct scenes`,
        icon: <DoorOpen className="h-4 w-4" />,
        priority: "high",
        details: portals.map(p => `${p.name} → Scene`).join(", "),
      });

      portals.forEach((portal) => {
        items.push({
          id: `portal-${portal.id}`,
          category: "Navigation",
          description: `Portal "${portal.name}" transitions correctly`,
          icon: <DoorOpen className="h-4 w-4" />,
          priority: "medium",
        });
      });
    }

    // Timer Check
    if (gameConfig.showTimer && gameConfig.timeLimit) {
      items.push({
        id: "timer-works",
        category: "Timer",
        description: "Timer counts down and triggers failure when expired",
        icon: <AlertTriangle className="h-4 w-4" />,
        priority: "high",
      });
    }

    // Inventory Check
    if (gameConfig.inventory.enabled) {
      items.push({
        id: "inventory-works",
        category: "Inventory",
        description: "Items appear in inventory when collected",
        icon: <Box className="h-4 w-4" />,
        priority: "medium",
      });
    }

    return items;
  }, [gameConfig, placedObjects, portals]);

  // Group by category
  const groupedChecklist = useMemo(() => {
    const groups: Record<string, ChecklistItem[]> = {};
    checklist.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [checklist]);

  const highPriorityCount = checklist.filter((i) => i.priority === "high").length;
  const totalCount = checklist.length;

  return (
    <div className={`bg-gv-neutral-900 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gv-neutral-700">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-gv-primary-400" />
          Testing Checklist
        </h3>
        <p className="text-sm text-gv-neutral-400 mt-1">
          {highPriorityCount} high priority items, {totalCount} total checks
        </p>
      </div>

      {/* Checklist */}
      <div className="p-4 space-y-6 max-h-[60vh] overflow-y-auto">
        {Object.entries(groupedChecklist).map(([category, items]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gv-neutral-300 mb-2 uppercase tracking-wide">
              {category}
            </h4>
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`flex items-start gap-3 p-2 rounded ${
                    item.status === "pass"
                      ? "bg-green-500/10"
                      : item.status === "fail"
                      ? "bg-red-500/10"
                      : "bg-gv-neutral-800"
                  }`}
                >
                  <div className="mt-0.5">
                    {item.status === "pass" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                    ) : item.status === "fail" ? (
                      <AlertTriangle className="h-4 w-4 text-red-400" />
                    ) : (
                      <Circle className="h-4 w-4 text-gv-neutral-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-gv-neutral-400">{item.icon}</span>
                      <span
                        className={`text-sm ${
                          item.status === "pass"
                            ? "text-green-300"
                            : "text-white"
                        }`}
                      >
                        {item.description}
                      </span>
                      {item.priority === "high" && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    {item.details && (
                      <p className="text-xs text-gv-neutral-500 mt-1 truncate">
                        {item.details}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gv-neutral-700 bg-gv-neutral-800/50">
        <p className="text-xs text-gv-neutral-400">
          Complete all high-priority items before publishing. Use playtest mode
          to verify each item manually.
        </p>
      </div>
    </div>
  );
}

/**
 * Compact summary for the editor sidebar
 */
export function TestingChecklistSummary({
  gameConfig,
  placedObjects,
  className = "",
}: {
  gameConfig: GameConfig;
  placedObjects: PlacedObject[];
  className?: string;
}) {
  const stats = useMemo(() => {
    const interactiveCount = placedObjects.filter(
      (o) => o.interactions && o.interactions.length > 0
    ).length;
    const objectiveCount = gameConfig.objectives.length;
    const winConditionCount = gameConfig.winConditions.filter(
      (c) => c.enabled
    ).length;

    return {
      objects: placedObjects.length,
      interactive: interactiveCount,
      objectives: objectiveCount,
      winConditions: winConditionCount,
    };
  }, [gameConfig, placedObjects]);

  return (
    <div className={`grid grid-cols-2 gap-2 text-center ${className}`}>
      <div className="bg-gv-neutral-800 rounded p-2">
        <div className="text-lg font-bold text-white">{stats.objects}</div>
        <div className="text-xs text-gv-neutral-400">Objects</div>
      </div>
      <div className="bg-gv-neutral-800 rounded p-2">
        <div className="text-lg font-bold text-white">{stats.interactive}</div>
        <div className="text-xs text-gv-neutral-400">Interactive</div>
      </div>
      <div className="bg-gv-neutral-800 rounded p-2">
        <div className="text-lg font-bold text-white">{stats.objectives}</div>
        <div className="text-xs text-gv-neutral-400">Objectives</div>
      </div>
      <div className="bg-gv-neutral-800 rounded p-2">
        <div className="text-lg font-bold text-white">{stats.winConditions}</div>
        <div className="text-xs text-gv-neutral-400">Win Conditions</div>
      </div>
    </div>
  );
}
