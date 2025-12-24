"use client";

import { useState, useRef, useEffect } from "react";
import { Check, X, Pencil } from "lucide-react";

interface EditableTextProps {
  value: string | null;
  placeholder: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  multiline?: boolean;
  className?: string;
}

export function EditableText({
  value,
  placeholder,
  onSave,
  isEditing,
  multiline = false,
  className = "",
}: EditableTextProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  const handleSave = () => {
    onSave(localValue);
    setIsActive(false);
  };

  const handleCancel = () => {
    setLocalValue(value || "");
    setIsActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <span className={className}>
        {value || <span className="text-gv-neutral-500 italic">{placeholder}</span>}
      </span>
    );
  }

  if (isActive) {
    return (
      <div className="flex items-start gap-2">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 bg-gv-neutral-800 border border-gv-primary-500 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-gv-primary-500 resize-none ${className}`}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`flex-1 bg-gv-neutral-800 border border-gv-primary-500 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-gv-primary-500 ${className}`}
          />
        )}
        <button
          onClick={handleSave}
          className="p-1 text-gv-success hover:bg-gv-success/10 rounded transition-colors"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-gv-neutral-400 hover:bg-gv-neutral-700 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsActive(true)}
      className={`group flex items-center gap-2 text-left hover:bg-gv-neutral-800/50 rounded px-1 -mx-1 transition-colors ${className}`}
    >
      <span className="flex-1">
        {value || <span className="text-gv-neutral-500 italic">{placeholder}</span>}
      </span>
      <Pencil className="h-3 w-3 text-gv-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

interface EditableSelectProps {
  value: string | null;
  options: { value: string; label: string }[];
  placeholder: string;
  onSave: (value: string | null) => void;
  isEditing: boolean;
  className?: string;
}

export function EditableSelect({
  value,
  options,
  placeholder,
  onSave,
  isEditing,
  className = "",
}: EditableSelectProps) {
  const [isActive, setIsActive] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (isActive && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isActive]);

  const currentLabel = options.find((o) => o.value === value)?.label;

  if (!isEditing) {
    return (
      <span className={className}>
        {currentLabel || <span className="text-gv-neutral-500 italic">{placeholder}</span>}
      </span>
    );
  }

  if (isActive) {
    return (
      <div className="flex items-center gap-2">
        <select
          ref={selectRef}
          value={value || ""}
          onChange={(e) => {
            onSave(e.target.value || null);
            setIsActive(false);
          }}
          onBlur={() => setIsActive(false)}
          className={`flex-1 bg-gv-neutral-800 border border-gv-primary-500 rounded px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-gv-primary-500 ${className}`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsActive(true)}
      className={`group flex items-center gap-2 text-left hover:bg-gv-neutral-800/50 rounded px-1 -mx-1 transition-colors ${className}`}
    >
      <span className="flex-1">
        {currentLabel || <span className="text-gv-neutral-500 italic">{placeholder}</span>}
      </span>
      <Pencil className="h-3 w-3 text-gv-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

interface EditableTagsProps {
  values: string[];
  placeholder: string;
  onSave: (values: string[]) => void;
  isEditing: boolean;
}

export function EditableTags({
  values,
  placeholder,
  onSave,
  isEditing,
}: EditableTagsProps) {
  const [newTag, setNewTag] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = () => {
    const trimmed = newTag.trim();
    if (trimmed && !values.includes(trimmed)) {
      onSave([...values, trimmed]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    onSave(values.filter((v) => v !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  if (!isEditing) {
    if (values.length === 0) {
      return <span className="text-gv-neutral-500 italic">{placeholder}</span>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {values.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gv-primary-500/10 border border-gv-primary-500/30 rounded text-xs text-gv-primary-400"
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {values.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-gv-primary-500/10 border border-gv-primary-500/30 rounded text-xs text-gv-primary-400 flex items-center gap-1 group"
          >
            {tag}
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-gv-neutral-500 hover:text-gv-error transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add element..."
          className="flex-1 bg-gv-neutral-800 border border-gv-neutral-700 rounded px-2 py-1 text-sm text-white placeholder:text-gv-neutral-500 focus:outline-none focus:border-gv-primary-500"
        />
        <button
          onClick={handleAddTag}
          disabled={!newTag.trim()}
          className="px-2 py-1 bg-gv-primary-500/20 text-gv-primary-400 rounded text-sm hover:bg-gv-primary-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
    </div>
  );
}
