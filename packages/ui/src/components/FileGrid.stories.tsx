import type { Meta, StoryObj } from '@storybook/react';
import { FileGrid, FileUploadArea } from './FileGrid';
import { fn } from '@storybook/test';

const meta: Meta<typeof FileGrid> = {
  title: 'Domain/FileGrid',
  component: FileGrid,
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

const sampleFiles = [
  { id: '1', name: 'Your-file.jpg', type: 'image' as const },
  { id: '2', name: 'Your-file.jpg', type: 'image' as const },
  { id: '3', name: 'Your-file.jpg', type: 'image' as const },
  { id: '4', name: 'Your-file.jpg', type: 'image' as const },
  { id: '5', name: 'Your-file.jpg', type: 'image' as const },
  { id: '6', name: 'Your-file.jpg', type: 'image' as const },
  { id: '7', name: 'Your-file.jpg', type: 'image' as const },
  { id: '8', name: 'Your-file.jpg', type: 'image' as const },
];

export const Default: Story = {
  args: {
    files: sampleFiles,
    onRemove: fn(),
    className: 'w-[600px]',
  },
};

export const WithUploading: Story = {
  args: {
    files: [
      { id: '1', name: 'Your-file.jpg', type: 'image' as const, progress: 25 },
      { id: '2', name: 'camera_02.mp4', type: 'video' as const, progress: 68 },
      { id: '3', name: 'completed.jpg', type: 'image' as const },
      { id: '4', name: 'another.jpg', type: 'image' as const },
    ],
    onRemove: fn(),
    className: 'w-[600px]',
  },
};

export const Selectable: Story = {
  args: {
    files: [
      { id: '1', name: 'file_01.jpg', type: 'image' as const, selected: true },
      { id: '2', name: 'file_02.jpg', type: 'image' as const, selected: true },
      { id: '3', name: 'file_03.jpg', type: 'image' as const },
      { id: '4', name: 'file_04.jpg', type: 'image' as const },
      { id: '5', name: 'file_05.jpg', type: 'image' as const },
      { id: '6', name: 'file_06.jpg', type: 'image' as const },
    ],
    selectable: true,
    onSelect: fn(),
    onRemove: fn(),
    className: 'w-[600px]',
  },
};

export const UploadArea: Story = {
  render: () => (
    <div className="w-[500px] p-6 bg-gv-neutral-800 rounded-gv-lg">
      <FileUploadArea
        onUpload={(files) => console.log('Uploaded:', files)}
        maxSize="5GB"
      />
    </div>
  ),
};

export const FullUploadFlow: Story = {
  render: () => (
    <div className="w-[600px] space-y-4 p-6 bg-gv-neutral-800 rounded-gv-lg">
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-gv-neutral-700 text-white rounded-gv text-sm font-medium">
          Uploads
        </button>
        <button className="px-4 py-2 text-gv-neutral-400 hover:text-white rounded-gv text-sm font-medium">
          Library
        </button>
      </div>
      <FileUploadArea
        onUpload={(files) => console.log('Uploaded:', files)}
        maxSize="5GB"
      />
    </div>
  ),
};
