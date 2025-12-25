"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Clock, Users, Star, ChevronRight } from "lucide-react";
import { type Experience, formatPlayCount, formatDuration, getCreatorById } from "@/lib/mock-data";

interface ExperienceCardProps {
  experience: Experience;
  showCreator?: boolean;
}

export function ExperienceCard({ experience, showCreator = true }: ExperienceCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const creator = getCreatorById(experience.creatorId);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card */}
      <Link
        href={`/experience/${experience.id}`}
        className="block rounded-gv-lg overflow-hidden bg-gv-neutral-800 border border-gv-neutral-700 hover:border-gv-neutral-600 transition-all duration-200"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <Image
            src={experience.thumbnail}
            alt={experience.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* Price Badge */}
          <div className="absolute top-2 right-2">
            {experience.price === 0 ? (
              <span className="px-2 py-1 bg-green-500/90 text-white text-xs font-bold rounded">
                FREE
              </span>
            ) : (
              <span className="px-2 py-1 bg-gv-neutral-900/90 text-white text-xs font-bold rounded">
                ${experience.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-gv-neutral-900/80 rounded text-xs text-white">
            <Clock className="h-3 w-3" />
            {formatDuration(experience.duration)}
          </div>

          {/* Play Overlay on Hover */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-gv-primary-500 flex items-center justify-center shadow-gv-glow">
              <Play className="h-6 w-6 text-white ml-1" fill="white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">
            {experience.title}
          </h3>

          {showCreator && creator && (
            <p className="text-gv-neutral-400 text-xs mb-2">
              {creator.displayName}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center gap-3 text-xs text-gv-neutral-500">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {formatPlayCount(experience.playCount)}
            </span>
            {experience.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-gv-warning-500 text-gv-warning-500" />
                {experience.rating.toFixed(1)}
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1 mt-2">
            {experience.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gv-neutral-700/50 text-gv-neutral-400 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Hover Detail Panel - Steam Style */}
      {isHovered && (
        <div
          className="absolute left-full top-0 ml-2 w-72 bg-gv-neutral-800 border border-gv-neutral-700 rounded-gv-lg shadow-gv-lg p-4 z-50 animate-fade-in hidden lg:block"
          style={{ pointerEvents: 'none' }}
        >
          <h4 className="font-semibold text-white mb-2">{experience.title}</h4>

          <p className="text-sm text-gv-neutral-300 mb-3 line-clamp-3">
            {experience.description}
          </p>

          {/* Meta Info */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between text-gv-neutral-400">
              <span>Category</span>
              <span className="text-white capitalize">{experience.category}</span>
            </div>
            <div className="flex justify-between text-gv-neutral-400">
              <span>Age Rating</span>
              <span className="text-white">{experience.ageRating}</span>
            </div>
            <div className="flex justify-between text-gv-neutral-400">
              <span>Released</span>
              <span className="text-white">
                {new Date(experience.releaseDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* All Tags */}
          <div className="flex flex-wrap gap-1 mb-4">
            {experience.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gv-neutral-700 text-gv-neutral-300 text-xs rounded"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Quick Action */}
          <div className="flex items-center justify-between pt-3 border-t border-gv-neutral-700">
            <span className="text-gv-neutral-400 text-sm">
              {experience.price === 0 ? "Free to Play" : `$${experience.price.toFixed(2)}`}
            </span>
            <span className="flex items-center gap-1 text-gv-primary-500 text-sm font-medium">
              View Details <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
