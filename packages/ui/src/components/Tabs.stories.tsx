import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './Card';
import { Input } from './Input';
import { Label } from './Label';
import { Button } from './Button';

const meta: Meta<typeof Tabs> = {
  title: 'Core/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="James" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue="james@gameview.ai" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

export const SettingsTabs: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[500px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="paths">Paths</TabsTrigger>
        <TabsTrigger value="advanced">Advanced</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Theme</Label>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Light</Button>
            <Button variant="outline" size="sm">Dark</Button>
            <Button size="sm">System</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Default Preset</Label>
          <select className="w-full rounded-md border border-gv-neutral-300 p-2">
            <option>Fast</option>
            <option>Balanced</option>
            <option>High</option>
            <option>Maximum</option>
          </select>
        </div>
      </TabsContent>
      <TabsContent value="paths" className="space-y-4 pt-4">
        <div className="space-y-2">
          <Label>Output Directory</Label>
          <div className="flex gap-2">
            <Input readOnly placeholder="Select output folder..." />
            <Button variant="outline">Browse</Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>COLMAP Path</Label>
          <div className="flex gap-2">
            <Input readOnly placeholder="Auto-detect" />
            <Button variant="outline">Browse</Button>
          </div>
        </div>
      </TabsContent>
      <TabsContent value="advanced" className="space-y-4 pt-4">
        <p className="text-sm text-gv-neutral-500">
          Advanced settings for power users.
        </p>
      </TabsContent>
    </Tabs>
  ),
};
