import type { Meta, StoryObj } from '@storybook/react';
import { AppSidebar, defaultNavItems } from './AppSidebar';
import { fn } from '@storybook/test';

const meta: Meta<typeof AppSidebar> = {
  title: 'Layout/AppSidebar',
  component: AppSidebar,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'dark',
      values: [{ name: 'dark', value: '#0f172a' }],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {
  args: {
    items: defaultNavItems,
    activeId: 'dashboard',
    collapsed: true,
    onItemClick: fn(),
    onToggle: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export const Expanded: Story = {
  args: {
    items: defaultNavItems,
    activeId: 'productions',
    collapsed: false,
    onItemClick: fn(),
    onToggle: fn(),
    logo: (
      <div className="flex items-center gap-2">
        <span className="text-2xl">🐰</span>
        <span className="text-lg font-bold text-white">Game View</span>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export const WithBadges: Story = {
  args: {
    items: [
      { ...defaultNavItems[0] },
      { ...defaultNavItems[1], badge: 3 },
      { ...defaultNavItems[2] },
      { ...defaultNavItems[3], badge: 12 },
      { ...defaultNavItems[4] },
      { ...defaultNavItems[5] },
    ],
    activeId: 'dashboard',
    collapsed: true,
    onItemClick: fn(),
  },
  decorators: [
    (Story) => (
      <div className="h-screen">
        <Story />
      </div>
    ),
  ],
};

export const InAppLayout: Story = {
  render: () => (
    <div className="flex h-screen bg-gv-neutral-900">
      <AppSidebar
        items={defaultNavItems}
        activeId="productions"
        collapsed={true}
        onItemClick={fn()}
      />
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-gv-neutral-800 flex items-center px-6 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐰</span>
            <span className="font-bold text-white">GAME VIEW</span>
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search an existing production"
              className="w-full px-4 py-2 bg-gv-neutral-800 border border-gv-neutral-700 rounded-full text-sm text-gv-neutral-300 placeholder-gv-neutral-500"
            />
          </div>
          <button className="px-4 py-2 bg-gv-primary-500 text-white rounded-gv text-sm font-medium flex items-center gap-2">
            New
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-3">
            <button className="text-gv-neutral-400 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gv-neutral-700" />
            <span className="text-sm text-white">James Curry</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold text-white mb-6">Your productions</h1>
          <div className="grid grid-cols-2 gap-4">
            <div className="aspect-video bg-gv-neutral-800 rounded-gv-lg" />
            <div className="aspect-video bg-gv-neutral-800 rounded-gv-lg" />
          </div>
        </main>
      </div>
    </div>
  ),
};
