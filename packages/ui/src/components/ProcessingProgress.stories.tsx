import type { Meta, StoryObj } from '@storybook/react';
import { ProcessingProgress } from './ProcessingProgress';

const meta: Meta<typeof ProcessingProgress> = {
  title: 'Domain/ProcessingProgress',
  component: ProcessingProgress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: {
    progress: {
      stage: 'idle',
      progress: 0,
    },
    className: 'w-[500px]',
  },
};

export const ExtractingFrames: Story = {
  args: {
    progress: {
      stage: 'extracting_frames',
      progress: 35,
      message: 'Extracting frames from video 2/6',
      currentStep: 1,
      totalSteps: 4,
    },
    className: 'w-[500px]',
  },
};

export const RunningColmap: Story = {
  args: {
    progress: {
      stage: 'running_colmap',
      progress: 55,
      message: 'Running feature matching...',
      currentStep: 2,
      totalSteps: 4,
    },
    className: 'w-[500px]',
  },
};

export const RunningBrush: Story = {
  args: {
    progress: {
      stage: 'running_brush',
      progress: 72,
      message: 'Training iteration 5000/7000',
      currentStep: 3,
      totalSteps: 4,
    },
    className: 'w-[500px]',
  },
};

export const Exporting: Story = {
  args: {
    progress: {
      stage: 'exporting',
      progress: 95,
      message: 'Writing PLY file...',
      currentStep: 4,
      totalSteps: 4,
    },
    className: 'w-[500px]',
  },
};

export const Completed: Story = {
  args: {
    progress: {
      stage: 'completed',
      progress: 100,
      message: 'Processing complete!',
    },
    className: 'w-[500px]',
  },
};

export const Failed: Story = {
  args: {
    progress: {
      stage: 'failed',
      progress: 45,
      message: 'COLMAP failed: insufficient features detected',
    },
    className: 'w-[500px]',
  },
};
