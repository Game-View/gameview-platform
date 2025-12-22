import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from './Progress';

const meta: Meta<typeof Progress> = {
  title: 'Core/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    className: 'w-[300px]',
  },
};

export const Empty: Story = {
  args: {
    value: 0,
    className: 'w-[300px]',
  },
};

export const Full: Story = {
  args: {
    value: 100,
    className: 'w-[300px]',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="w-[300px] space-y-2">
      <div className="flex justify-between text-sm">
        <span>Processing</span>
        <span>75%</span>
      </div>
      <Progress value={75} />
    </div>
  ),
};

export const Stages: Story = {
  render: () => (
    <div className="w-[400px] space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Extracting Frames</span>
          <span className="text-gv-neutral-500">Complete</span>
        </div>
        <Progress value={100} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Running COLMAP</span>
          <span>45%</span>
        </div>
        <Progress value={45} />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Training 3DGS</span>
          <span className="text-gv-neutral-500">Pending</span>
        </div>
        <Progress value={0} />
      </div>
    </div>
  ),
};
