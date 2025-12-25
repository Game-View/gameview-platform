"use client";

import { useEffect, useState } from "react";
import {
  Package,
  Target,
  Timer,
  Trophy,
  Star,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import {
  usePlaytestStore,
  selectFormattedScore,
  selectRemainingTime,
  selectInventoryCount,
} from "@/stores/playtest-store";
import { formatTime } from "@/lib/player-runtime";

interface PlayerHUDProps {
  className?: string;
}

export function PlayerHUD({ className = "" }: PlayerHUDProps) {
  const {
    gameConfig,
    playerState,
    activeMessage,
    showInventory,
    showObjectives,
    toggleInventory,
    toggleObjectives,
    hideMessage,
  } = usePlaytestStore();

  const formattedScore = usePlaytestStore(selectFormattedScore);
  const remainingTime = usePlaytestStore(selectRemainingTime);
  const inventoryCount = usePlaytestStore(selectInventoryCount);

  // Score popup animation
  const [scorePopup, setScorePopup] = useState<{ value: number; key: number } | null>(null);

  useEffect(() => {
    const unsubscribe = usePlaytestStore.subscribe((state, prevState) => {
      const delta = state.playerState.score - prevState.playerState.score;
      if (delta !== 0 && state.gameConfig?.scoring.showPopups) {
        setScorePopup({ value: delta, key: Date.now() });
        setTimeout(() => setScorePopup(null), 1000);
      }
    });
    return unsubscribe;
  }, []);

  if (!gameConfig) return null;

  const { scoring, inventory, objectives } = gameConfig;
  const completedObjectives = Array.from(playerState.objectivesProgress.values()).filter(
    (o) => o.completed
  ).length;
  const totalObjectives = objectives.length;

  // Check if timer is running low
  const isTimerWarning = remainingTime !== null && remainingTime < 30000;
  const isTimerCritical = remainingTime !== null && remainingTime < 10000;

  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Top HUD Bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Left side - Score */}
        {scoring.enabled && scoring.showInHUD && (
          <div className="relative">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-bold text-lg">{formattedScore}</span>
            </div>

            {/* Score popup */}
            {scorePopup && (
              <div
                key={scorePopup.key}
                className={`absolute left-1/2 -translate-x-1/2 -top-8 font-bold text-lg animate-score-popup ${
                  scorePopup.value > 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {scorePopup.value > 0 ? "+" : ""}
                {scorePopup.value}
              </div>
            )}
          </div>
        )}

        {/* Center - Timer */}
        {gameConfig.showTimer && gameConfig.timeLimit && (
          <div
            className={`px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg flex items-center gap-2 ${
              isTimerCritical
                ? "bg-red-500/60 animate-pulse"
                : isTimerWarning
                ? "bg-orange-500/40"
                : ""
            }`}
          >
            <Timer
              className={`h-5 w-5 ${
                isTimerCritical
                  ? "text-red-300"
                  : isTimerWarning
                  ? "text-orange-300"
                  : "text-white"
              }`}
            />
            <span
              className={`font-mono font-bold text-lg ${
                isTimerCritical
                  ? "text-red-300"
                  : isTimerWarning
                  ? "text-orange-300"
                  : "text-white"
              }`}
            >
              {formatTime(remainingTime ?? 0)}
            </span>
          </div>
        )}

        {/* Right side - Inventory & Objectives */}
        <div className="flex items-center gap-2">
          {/* Objectives */}
          {objectives.length > 0 && (
            <button
              onClick={toggleObjectives}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
            >
              <Target className="h-5 w-5 text-gv-primary-400" />
              <span className="text-white font-medium">
                {completedObjectives}/{totalObjectives}
              </span>
              {showObjectives ? (
                <ChevronUp className="h-4 w-4 text-gv-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
              )}
            </button>
          )}

          {/* Inventory */}
          {inventory.enabled && inventory.showInHUD && (
            <button
              onClick={toggleInventory}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg hover:bg-black/70 transition-colors"
            >
              <Package className="h-5 w-5 text-gv-primary-400" />
              {inventory.showCount && (
                <span className="text-white font-medium">{inventoryCount}</span>
              )}
              {showInventory ? (
                <ChevronUp className="h-4 w-4 text-gv-neutral-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gv-neutral-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Objectives Panel */}
      {showObjectives && objectives.length > 0 && (
        <div className="absolute top-16 right-4 w-72 bg-black/80 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-gv-primary-400" />
            Objectives
          </h3>
          <ul className="space-y-2">
            {objectives.map((objective) => {
              const progress = playerState.objectivesProgress.get(objective.id);
              const isCompleted = progress?.completed ?? false;

              if (objective.hidden && !isCompleted) return null;

              return (
                <li
                  key={objective.id}
                  className={`flex items-start gap-2 text-sm ${
                    isCompleted ? "text-green-400" : "text-gv-neutral-300"
                  }`}
                >
                  <span className="mt-0.5">
                    {isCompleted ? (
                      <Trophy className="h-4 w-4" />
                    ) : (
                      <span className="w-4 h-4 inline-block border border-gv-neutral-500 rounded" />
                    )}
                  </span>
                  <span className={isCompleted ? "line-through" : ""}>
                    {objective.name}
                    {objective.showProgress &&
                      objective.targetCount &&
                      !isCompleted && (
                        <span className="text-gv-neutral-500 ml-1">
                          ({progress?.progress ?? 0}/{objective.targetCount})
                        </span>
                      )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Inventory Panel */}
      {showInventory && inventory.enabled && (
        <div className="absolute top-16 right-4 w-80 bg-black/80 backdrop-blur-sm rounded-lg p-4 pointer-events-auto">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-gv-primary-400" />
            Inventory
          </h3>

          {playerState.inventory.length === 0 ? (
            <p className="text-gv-neutral-400 text-sm">No items collected yet</p>
          ) : (
            <div
              className={`gap-2 ${
                inventory.displayStyle === "grid"
                  ? "grid grid-cols-4"
                  : "flex flex-col"
              }`}
            >
              {playerState.inventory.map((item) => (
                <div
                  key={item.itemId}
                  className={`${
                    inventory.displayStyle === "grid"
                      ? "aspect-square bg-gv-neutral-800 rounded flex items-center justify-center relative"
                      : "flex items-center gap-3 p-2 bg-gv-neutral-800 rounded"
                  }`}
                  title={item.name}
                >
                  {inventory.displayStyle === "grid" ? (
                    <>
                      <Package className="h-6 w-6 text-gv-primary-400" />
                      {item.quantity > 1 && (
                        <span className="absolute bottom-0 right-0 text-xs bg-gv-neutral-700 px-1 rounded">
                          {item.quantity}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      <Package className="h-5 w-5 text-gv-primary-400 flex-shrink-0" />
                      <span className="text-white text-sm flex-1">{item.name}</span>
                      {item.quantity > 1 && (
                        <span className="text-gv-neutral-400 text-sm">
                          x{item.quantity}
                        </span>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Display */}
      {activeMessage && (
        <MessageDisplay
          title={activeMessage.title}
          message={activeMessage.message}
          style={activeMessage.style}
          onDismiss={hideMessage}
        />
      )}

      {/* Win/Fail Overlay */}
      {playerState.hasWon && <WinOverlay />}
      {playerState.hasFailed && <FailOverlay />}

      {/* Crosshair */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-2 h-2 border-2 border-white rounded-full opacity-50" />
      </div>
    </div>
  );
}

// Message Display Component
function MessageDisplay({
  title,
  message,
  style,
  onDismiss,
}: {
  title?: string;
  message: string;
  style: string;
  onDismiss: () => void;
}) {
  if (style === "toast") {
    return (
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-md animate-slide-up">
        <div className="bg-black/80 backdrop-blur-sm rounded-lg px-6 py-3 text-center pointer-events-auto">
          {title && <p className="text-gv-primary-400 font-semibold text-sm">{title}</p>}
          <p className="text-white">{message}</p>
        </div>
      </div>
    );
  }

  if (style === "dialog") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto">
        <div className="bg-gv-neutral-900 rounded-lg p-6 max-w-md text-center shadow-2xl">
          {title && <h3 className="text-xl font-bold text-white mb-2">{title}</h3>}
          <p className="text-gv-neutral-300 mb-4">{message}</p>
          <button
            onClick={onDismiss}
            className="px-6 py-2 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Subtitle style
  return (
    <div className="absolute bottom-32 left-0 right-0 flex justify-center pointer-events-none">
      <div className="bg-black/70 px-4 py-2 rounded">
        <p className="text-white text-lg">{message}</p>
      </div>
    </div>
  );
}

// Win Overlay
function WinOverlay() {
  const { gameConfig, resetPlaytest, stopPlaytest } = usePlaytestStore();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto animate-fade-in">
      <div className="text-center">
        <div className="mb-6">
          <Trophy className="h-20 w-20 text-yellow-400 mx-auto animate-bounce" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">
          {gameConfig?.winTitle ?? "Congratulations!"}
        </h2>
        <p className="text-xl text-gv-neutral-300 mb-8">
          {gameConfig?.winMessage ?? "You completed the experience!"}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={resetPlaytest}
            className="px-6 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={stopPlaytest}
            className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

// Fail Overlay
function FailOverlay() {
  const { gameConfig, resetPlaytest, stopPlaytest } = usePlaytestStore();

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto animate-fade-in">
      <div className="text-center">
        <div className="mb-6">
          <X className="h-20 w-20 text-red-500 mx-auto" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-2">
          {gameConfig?.failTitle ?? "Try Again"}
        </h2>
        <p className="text-xl text-gv-neutral-300 mb-8">
          {gameConfig?.failMessage ?? "Better luck next time!"}
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={resetPlaytest}
            className="px-6 py-3 bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={stopPlaytest}
            className="px-6 py-3 bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-lg transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
