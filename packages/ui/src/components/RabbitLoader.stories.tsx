import type { Meta, StoryObj } from '@storybook/react';
import { RabbitLoader } from './RabbitLoader';

const meta: Meta<typeof RabbitLoader> = {
  title: 'Domain/RabbitLoader',
  component: RabbitLoader,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: 'Loading...',
  },
};

export const WithProgress: Story = {
  args: {
    message: 'Rendering map...',
    progress: 35,
  },
};

export const Processing: Story = {
  args: {
    message: 'Processing videos...',
    progress: 72,
  },
};

export const Small: Story = {
  args: {
    message: 'Loading...',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    message: 'Rendering map...',
    progress: 50,
    size: 'lg',
  },
};

export const InContext: Story = {
  render: () => (
    <div className="w-[500px] h-[300px] bg-gv-neutral-800 rounded-gv-lg flex items-center justify-center">
      <RabbitLoader message="Rendering map..." progress={35} />
    </div>
  ),
};
