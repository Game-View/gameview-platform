import type { Meta, StoryObj } from '@storybook/react';
import { VideoDropZone } from './VideoDropZone';
import { fn } from '@storybook/test';

const meta: Meta<typeof VideoDropZone> = {
  title: 'Domain/VideoDropZone',
  component: VideoDropZone,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    onDrop: fn(),
    onBrowse: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'w-[500px]',
  },
};

export const SingleFile: Story = {
  args: {
    multiple: false,
    className: 'w-[500px]',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    className: 'w-[500px]',
  },
};

export const Compact: Story = {
  args: {
    className: 'w-[400px] min-h-[120px]',
  },
};

export const InContext: Story = {
  render: () => (
    <div className="w-[600px] space-y-4">
      <h3 className="text-lg font-semibold">Import Videos</h3>
      <p className="text-sm text-gv-neutral-500">
        Add multi-camera footage for 3D reconstruction
      </p>
      <VideoDropZone onDrop={fn()} onBrowse={fn()} />
    </div>
  ),
};
