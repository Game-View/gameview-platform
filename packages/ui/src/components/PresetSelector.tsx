import * as React from 'react';
import * as Select from '@radix-ui/react-select';
import type { QualityPreset } from '@gameview/types';
import { cn } from '../lib/utils';
import { ChevronDown, Check, Zap, Scale, Sparkles, Crown } from 'lucide-react';

interface PresetOption {
  value: QualityPreset;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const presets: PresetOption[] = [
  {
    value: 'fast',
    label: 'Fast',
    description: 'Quick processing, lower quality',
    icon: <Zap className="h-4 w-4 text-yellow-500" />,
  },
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Good quality, reasonable speed',
    icon: <Scale className="h-4 w-4 text-blue-500" />,
  },
  {
    value: 'high',
    label: 'High',
    description: 'High quality, longer processing',
    icon: <Sparkles className="h-4 w-4 text-purple-500" />,
  },
  {
    value: 'maximum',
    label: 'Maximum',
    description: 'Best quality, longest processing',
    icon: <Crown className="h-4 w-4 text-amber-500" />,
  },
];

interface PresetSelectorProps {
  value: QualityPreset;
  onValueChange: (value: QualityPreset) => void;
  className?: string;
  disabled?: boolean;
}

export function PresetSelector({
  value,
  onValueChange,
  className,
  disabled = false,
}: PresetSelectorProps) {
  const selectedPreset = presets.find((p) => p.value === value);

  return (
    <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <Select.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-gv-neutral-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-gv-primary-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:border-gv-neutral-700 dark:bg-gv-neutral-900',
          className
        )}
      >
        <Select.Value>
          <span className="flex items-center gap-2">
            {selectedPreset?.icon}
            {selectedPreset?.label}
          </span>
        </Select.Value>
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className={cn(
            'relative z-50 min-w-[200px] overflow-hidden rounded-md border border-gv-neutral-200 bg-white shadow-md',
            'dark:border-gv-neutral-700 dark:bg-gv-neutral-900'
          )}
        >
          <Select.Viewport className="p-1">
            {presets.map((preset) => (
              <Select.Item
                key={preset.value}
                value={preset.value}
                className={cn(
                  'relative flex cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none',
                  'focus:bg-gv-neutral-100 dark:focus:bg-gv-neutral-800',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50'
                )}
              >
                <Select.ItemIndicator className="absolute left-2 flex h-4 w-4 items-center justify-center">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
                <div className="flex flex-col">
                  <span className="flex items-center gap-2 font-medium">
                    {preset.icon}
                    {preset.label}
                  </span>
                  <span className="text-xs text-gv-neutral-500">{preset.description}</span>
                </div>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
