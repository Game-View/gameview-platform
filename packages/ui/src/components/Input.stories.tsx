import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { Label } from './Label';

const meta: Meta<typeof Input> = {
  title: 'Core/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input type="email" id="email" placeholder="Enter your email" />
    </div>
  ),
};

export const WithValue: Story = {
  args: {
    value: 'example@gameview.ai',
    readOnly: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
  },
};

export const FilePath: Story = {
  render: () => (
    <div className="grid w-full max-w-md items-center gap-1.5">
      <Label htmlFor="output">Output Directory</Label>
      <Input
        id="output"
        value="C:\Users\james\Documents\GameView\outputs"
        readOnly
        className="font-mono text-sm"
      />
    </div>
  ),
};

export const Types: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-[300px]">
      <Input type="text" placeholder="Text input" />
      <Input type="email" placeholder="Email input" />
      <Input type="password" placeholder="Password input" />
      <Input type="number" placeholder="Number input" />
      <Input type="search" placeholder="Search..." />
    </div>
  ),
};
