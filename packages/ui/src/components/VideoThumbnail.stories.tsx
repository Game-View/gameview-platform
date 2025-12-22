import type { Meta, StoryObj } from '@storybook/react';
import { VideoThumbnail } from './VideoThumbnail';
import { fn } from '@storybook/test';

const meta: Meta<typeof VideoThumbnail> = {
  title: 'Domain/VideoThumbnail',
  component: VideoThumbnail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'camera_01.mp4',
    duration: 125,
    width: 1920,
    height: 1080,
    fps: 30,
    className: 'w-[250px]',
  },
};

export const NoThumbnail: Story = {
  args: {
    name: 'video_without_thumbnail.mp4',
    duration: 60,
    className: 'w-[250px]',
  },
};

export const Selected: Story = {
  args: {
    name: 'selected_video.mp4',
    duration: 90,
    width: 3840,
    height: 2160,
    fps: 60,
    selected: true,
    onSelect: fn(),
    className: 'w-[250px]',
  },
};

export const WithActions: Story = {
  args: {
    name: 'interactive_video.mp4',
    duration: 180,
    width: 1920,
    height: 1080,
    fps: 30,
    onSelect: fn(),
    onRemove: fn(),
    onPlay: fn(),
    className: 'w-[250px]',
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[800px]">
      <VideoThumbnail
        name="camera_01.mp4"
        duration={125}
        width={1920}
        height={1080}
        fps={30}
        onRemove={fn()}
      />
      <VideoThumbnail
        name="camera_02.mp4"
        duration={125}
        width={1920}
        height={1080}
        fps={30}
        selected
        onRemove={fn()}
      />
      <VideoThumbnail
        name="camera_03.mp4"
        duration={125}
        width={1920}
        height={1080}
        fps={30}
        onRemove={fn()}
      />
      <VideoThumbnail
        name="camera_04.mp4"
        duration={125}
        width={1920}
        height={1080}
        fps={30}
        onRemove={fn()}
      />
      <VideoThumbnail
        name="camera_05.mp4"
        duration={125}
        width={1920}
        height={1080}
        fps={30}
        onRemove={fn()}
      />
      <VideoThumbnail
        name="camera_06.mp4"
        duration={125}
        width={1920}
        height={1080}
        fps={30}
        onRemove={fn()}
      />
    </div>
  ),
};
