"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Users, Sparkles, GraduationCap, Compass } from "lucide-react";
import { type Creator } from "@/lib/mock-data";

interface CreatorCardProps {
  creator: Creator;
  variant?: "default" | "compact";
}

const categoryIcons = {
  entertainment: Sparkles,
  education: GraduationCap,
  exploration: Compass,
};

const categoryColors = {
  entertainment: "text-gv-primary-500",
  education: "text-gv-accent-500",
  exploration: "text-gv-warning-500",
};

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export function CreatorCard({ creator, variant = "default" }: CreatorCardProps) {
  const CategoryIcon = categoryIcons[creator.category as keyof typeof categoryIcons];
  const categoryColor = categoryColors[creator.category as keyof typeof categoryColors];

  if (variant === "compact") {
    return (
      <Link
        href={`/creator/${creator.username}`}
        className="flex items-center gap-3 p-2 rounded-gv hover:bg-gv-neutral-800 transition-colors"
      >
        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
          <Image
            src={creator.avatar}
            alt={creator.displayName}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-medium text-white text-sm truncate">
              {creator.displayName}
            </span>
            {creator.isVerified && (
              <CheckCircle className="h-3.5 w-3.5 text-gv-primary-500 shrink-0" fill="currentColor" />
            )}
          </div>
          <p className="text-xs text-gv-neutral-500">
            {formatFollowers(creator.followers)} followers
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/creator/${creator.username}`}
      className="group block rounded-gv-lg overflow-hidden bg-gv-neutral-800 border border-gv-neutral-700 hover:border-gv-neutral-600 transition-all duration-200"
    >
      {/* Banner */}
      <div className="relative h-20 bg-gradient-to-br from-gv-neutral-700 to-gv-neutral-800">
        {creator.banner && (
          <Image
            src={creator.banner}
            alt=""
            fill
            className="object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gv-neutral-800 to-transparent" />
      </div>

      {/* Avatar & Info */}
      <div className="relative px-4 pb-4">
        {/* Avatar */}
        <div className="absolute -top-8 left-4">
          <div className="relative w-16 h-16 rounded-full overflow-hidden border-4 border-gv-neutral-800">
            <Image
              src={creator.avatar}
              alt={creator.displayName}
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Category Badge */}
        <div className="flex justify-end pt-2">
          {CategoryIcon && (
            <div className={`flex items-center gap-1 text-xs ${categoryColor}`}>
              <CategoryIcon className="h-3.5 w-3.5" />
              <span className="capitalize">{creator.category}</span>
            </div>
          )}
        </div>

        {/* Name & Verified */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-white group-hover:text-gv-primary-400 transition-colors">
              {creator.displayName}
            </h3>
            {creator.isVerified && (
              <CheckCircle className="h-4 w-4 text-gv-primary-500 shrink-0" fill="currentColor" />
            )}
          </div>
          <p className="text-xs text-gv-neutral-500 mt-0.5">@{creator.username}</p>
        </div>

        {/* Tagline */}
        {creator.tagline && (
          <p className="text-sm text-gv-neutral-400 mt-2 line-clamp-2">
            {creator.tagline}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gv-neutral-500">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatFollowers(creator.followers)} followers
          </span>
          <span>
            {creator.experienceCount} experience{creator.experienceCount !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
