"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  Link2,
  Trash2,
  ChevronRight,
  Check,
  Youtube,
  Twitter,
  Instagram,
  Play,
  Moon,
  Sun,
  Eye,
  EyeOff,
  Download,
  LogOut,
  Shield,
  HelpCircle,
  FileText,
} from "lucide-react";
import { mockCurrentUser } from "@/lib/mock-data";

// Platform icons mapping
const platformIcons: Record<string, typeof Youtube> = {
  youtube: Youtube,
  twitter: Twitter,
  instagram: Instagram,
  tiktok: Play,
  twitch: Play,
};

const platformColors: Record<string, string> = {
  youtube: "text-red-500",
  twitter: "text-blue-400",
  instagram: "text-pink-500",
  tiktok: "text-white",
  twitch: "text-purple-500",
};

type SettingsSection = "account" | "notifications" | "privacy" | "connections" | "data";

interface ToggleSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const user = mockCurrentUser;

  // Notification settings
  const [notifications, setNotifications] = useState<ToggleSetting[]>([
    {
      id: "new_experiences",
      label: "New Experiences",
      description: "Get notified when creators you follow release new experiences",
      enabled: true,
    },
    {
      id: "recommendations",
      label: "Recommendations",
      description: "Personalized suggestions based on your interests",
      enabled: true,
    },
    {
      id: "social_updates",
      label: "Social Updates",
      description: "When friends play experiences you might like",
      enabled: false,
    },
    {
      id: "marketing",
      label: "Marketing",
      description: "News, promotions, and special offers",
      enabled: false,
    },
  ]);

  // Privacy settings
  const [privacy, setPrivacy] = useState<ToggleSetting[]>([
    {
      id: "profile_public",
      label: "Public Profile",
      description: "Allow others to see your profile and activity",
      enabled: true,
    },
    {
      id: "show_activity",
      label: "Show Activity",
      description: "Display what you're playing on your profile",
      enabled: true,
    },
    {
      id: "allow_friend_requests",
      label: "Friend Requests",
      description: "Allow others to send you friend requests",
      enabled: true,
    },
    {
      id: "personalized_ads",
      label: "Personalized Recommendations",
      description: "Use your activity to personalize experience suggestions",
      enabled: true,
    },
  ]);

  const [darkMode, setDarkMode] = useState(true);

  const toggleNotification = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const togglePrivacy = (id: string) => {
    setPrivacy((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const sections = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Lock },
    { id: "connections", label: "Connected Apps", icon: Link2 },
    { id: "data", label: "Data & Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gv-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gv-neutral-800 bg-gv-neutral-900/95 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Profile</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">Settings</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Navigation */}
          <nav className="md:w-56 shrink-0">
            <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-4 md:pb-0 hide-scrollbar">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as SettingsSection)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-gv text-sm font-medium whitespace-nowrap transition-colors ${
                      activeSection === section.id
                        ? "bg-gv-neutral-800 text-white"
                        : "text-gv-neutral-400 hover:text-white hover:bg-gv-neutral-800/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Account Section */}
            {activeSection === "account" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Account</h2>
                  <p className="text-sm text-gv-neutral-500">
                    Manage your account details and preferences
                  </p>
                </div>

                {/* Profile Info */}
                <div className="p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <Image
                        src={user.avatar}
                        alt={user.displayName}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{user.displayName}</h3>
                      <p className="text-sm text-gv-neutral-400">@{user.username}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="px-4 py-2 text-sm font-medium text-gv-primary-500 hover:text-gv-primary-400 transition-colors"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>

                {/* Account Details */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gv-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-white">Email</p>
                      <p className="text-sm text-gv-neutral-400">{user.email}</p>
                    </div>
                    <button className="text-sm text-gv-primary-500 hover:text-gv-primary-400">
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gv-neutral-800">
                    <div>
                      <p className="text-sm font-medium text-white">Password</p>
                      <p className="text-sm text-gv-neutral-400">••••••••••••</p>
                    </div>
                    <button className="text-sm text-gv-primary-500 hover:text-gv-primary-400">
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-gv-neutral-800">
                    <div className="flex items-center gap-3">
                      {darkMode ? (
                        <Moon className="h-5 w-5 text-gv-neutral-400" />
                      ) : (
                        <Sun className="h-5 w-5 text-gv-neutral-400" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-white">Appearance</p>
                        <p className="text-sm text-gv-neutral-400">
                          {darkMode ? "Dark mode" : "Light mode"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setDarkMode(!darkMode)}
                      className={`relative w-11 h-6 rounded-full transition-colors ${
                        darkMode ? "bg-gv-primary-500" : "bg-gv-neutral-600"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          darkMode ? "translate-x-5" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Sign Out */}
                <button className="flex items-center gap-2 text-gv-neutral-400 hover:text-white transition-colors">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === "notifications" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Notifications</h2>
                  <p className="text-sm text-gv-neutral-500">
                    Choose what updates you want to receive
                  </p>
                </div>

                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between py-3 border-b border-gv-neutral-800"
                    >
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-medium text-white">{notification.label}</p>
                        <p className="text-sm text-gv-neutral-400">{notification.description}</p>
                      </div>
                      <button
                        onClick={() => toggleNotification(notification.id)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          notification.enabled ? "bg-gv-primary-500" : "bg-gv-neutral-600"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            notification.enabled ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-gv-neutral-800/50 rounded-gv border border-gv-neutral-700">
                  <p className="text-sm text-gv-neutral-400">
                    Push notifications can be managed in your device settings.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy Section */}
            {activeSection === "privacy" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Privacy</h2>
                  <p className="text-sm text-gv-neutral-500">
                    Control who can see your activity and how your data is used
                  </p>
                </div>

                <div className="space-y-4">
                  {privacy.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between py-3 border-b border-gv-neutral-800"
                    >
                      <div className="flex-1 pr-4">
                        <p className="text-sm font-medium text-white">{setting.label}</p>
                        <p className="text-sm text-gv-neutral-400">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => togglePrivacy(setting.id)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          setting.enabled ? "bg-gv-primary-500" : "bg-gv-neutral-600"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            setting.enabled ? "translate-x-5" : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Blocked Users */}
                <div className="p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Blocked Users</p>
                      <p className="text-sm text-gv-neutral-400">0 users blocked</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gv-neutral-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Connections Section */}
            {activeSection === "connections" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Connected Apps</h2>
                  <p className="text-sm text-gv-neutral-500">
                    Connect accounts to discover creators and share your plays
                  </p>
                </div>

                <div className="space-y-3">
                  {user.connectedAccounts.map((account) => {
                    const Icon = platformIcons[account.platform] || Link2;
                    const color = platformColors[account.platform] || "text-gv-neutral-400";

                    return (
                      <div
                        key={account.platform}
                        className="flex items-center justify-between p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${color}`} />
                          <div>
                            <p className="text-sm font-medium text-white capitalize">
                              {account.platform}
                            </p>
                            {account.connected && account.username && (
                              <p className="text-sm text-gv-neutral-400">@{account.username}</p>
                            )}
                          </div>
                        </div>
                        {account.connected ? (
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-green-400">
                              <Check className="h-3.5 w-3.5" />
                              Connected
                            </span>
                            <button className="text-sm text-gv-neutral-400 hover:text-red-400 transition-colors">
                              Disconnect
                            </button>
                          </div>
                        ) : (
                          <button className="px-4 py-1.5 text-sm font-medium bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-full transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-gv-primary-500/10 rounded-gv border border-gv-primary-500/30">
                  <p className="text-sm text-gv-primary-400">
                    Connected accounts help us recommend creators you already follow and let you share
                    your plays with friends.
                  </p>
                </div>
              </div>
            )}

            {/* Data & Security Section */}
            {activeSection === "data" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-white mb-1">Data & Security</h2>
                  <p className="text-sm text-gv-neutral-500">
                    Manage your data and account security
                  </p>
                </div>

                {/* Download Data */}
                <div className="p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700">
                  <div className="flex items-start gap-3">
                    <Download className="h-5 w-5 text-gv-neutral-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-white">Download Your Data</h3>
                      <p className="text-sm text-gv-neutral-400 mt-1">
                        Get a copy of your Game View data including your profile, play history, and preferences.
                      </p>
                      <button className="mt-3 px-4 py-2 text-sm font-medium bg-gv-neutral-700 hover:bg-gv-neutral-600 text-white rounded-gv transition-colors">
                        Request Download
                      </button>
                    </div>
                  </div>
                </div>

                {/* Two-Factor Auth */}
                <div className="p-4 bg-gv-neutral-800/50 rounded-gv-lg border border-gv-neutral-700">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-gv-neutral-400 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-medium text-white">Two-Factor Authentication</h3>
                        <span className="px-2 py-0.5 text-xs bg-gv-neutral-700 text-gv-neutral-400 rounded">
                          Not enabled
                        </span>
                      </div>
                      <p className="text-sm text-gv-neutral-400 mt-1">
                        Add an extra layer of security to your account.
                      </p>
                      <button className="mt-3 px-4 py-2 text-sm font-medium bg-gv-primary-500 hover:bg-gv-primary-600 text-white rounded-gv transition-colors">
                        Enable 2FA
                      </button>
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-2">
                  <Link
                    href="/privacy"
                    className="flex items-center justify-between p-4 bg-gv-neutral-800/50 rounded-gv border border-gv-neutral-700 hover:border-gv-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gv-neutral-400" />
                      <span className="text-sm text-white">Privacy Policy</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gv-neutral-500" />
                  </Link>

                  <Link
                    href="/terms"
                    className="flex items-center justify-between p-4 bg-gv-neutral-800/50 rounded-gv border border-gv-neutral-700 hover:border-gv-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gv-neutral-400" />
                      <span className="text-sm text-white">Terms of Service</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gv-neutral-500" />
                  </Link>

                  <Link
                    href="/help"
                    className="flex items-center justify-between p-4 bg-gv-neutral-800/50 rounded-gv border border-gv-neutral-700 hover:border-gv-neutral-600 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-gv-neutral-400" />
                      <span className="text-sm text-white">Help Center</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gv-neutral-500" />
                  </Link>
                </div>

                {/* Delete Account */}
                <div className="pt-6 border-t border-gv-neutral-800">
                  <button className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="h-4 w-4" />
                    <span className="text-sm">Delete Account</span>
                  </button>
                  <p className="text-xs text-gv-neutral-500 mt-2">
                    This will permanently delete your account and all associated data.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
