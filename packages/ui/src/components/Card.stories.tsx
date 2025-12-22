import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'Core/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the card content. You can put any content here.</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Cancel</Button>
        <Button>Save</Button>
      </CardFooter>
    </Card>
  ),
};

export const SimpleCard: Story = {
  render: () => (
    <Card className="w-[300px] p-6">
      <p>A simple card with just content.</p>
    </Card>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Card className="w-[350px] overflow-hidden">
      <div className="aspect-video bg-gv-neutral-200" />
      <CardHeader>
        <CardTitle>Video Processing Complete</CardTitle>
        <CardDescription>Your 3D reconstruction is ready</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gv-neutral-500">
          Processing took 15 minutes. The output file is 125MB.
        </p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Result</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[200px]">
      <CardHeader className="pb-2">
        <CardDescription>Total Videos</CardDescription>
        <CardTitle className="text-4xl">24</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-gv-neutral-500">+12% from last month</p>
      </CardContent>
    </Card>
  ),
};
