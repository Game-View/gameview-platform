import type { Meta, StoryObj } from '@storybook/react';
import { PresetSelector } from './PresetSelector';
import { fn } from '@storybook/test';
import { useState } from 'react';

const meta: Meta<typeof PresetSelector> = {
  title: 'Domain/PresetSelector',
  component: PresetSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 'balanced',
    onValueChange: fn(),
    className: 'w-[250px]',
  },
};

export const Fast: Story = {
  args: {
    value: 'fast',
    onValueChange: fn(),
    className: 'w-[250px]',
  },
};

export const High: Story = {
  args: {
    value: 'high',
    onValueChange: fn(),
    className: 'w-[250px]',
  },
};

export const Maximum: Story = {
  args: {
    value: 'maximum',
    onValueChange: fn(),
    className: 'w-[250px]',
  },
};

export const Disabled: Story = {
  args: {
    value: 'balanced',
    onValueChange: fn(),
    disabled: true,
    className: 'w-[250px]',
  },
};

export const Interactive: Story = {
  render: function InteractivePresetSelector() {
    const [value, setValue] = useState<'fast' | 'balanced' | 'high' | 'maximum'>('balanced');
    return (
      <div className="w-[300px] space-y-4">
        <PresetSelector value={value} onValueChange={setValue} />
        <p className="text-sm text-gv-neutral-500">
          Selected preset: <strong>{value}</strong>
        </p>
      </div>
    );
  },
};

export const InSettingsPanel: Story = {
  render: function SettingsPanel() {
    const [value, setValue] = useState<'fast' | 'balanced' | 'high' | 'maximum'>('balanced');
    return (
      <div className="w-[350px] space-y-4 rounded-lg border border-gv-neutral-200 p-4">
        <h3 className="font-semibold">Processing Settings</h3>
        <div className="space-y-2">
          <label className="text-sm font-medium">Quality Preset</label>
          <PresetSelector value={value} onValueChange={setValue} />
          <p className="text-xs text-gv-neutral-500">
            Higher quality takes longer to process but produces better results.
          </p>
        </div>
      </div>
    );
  },
};
